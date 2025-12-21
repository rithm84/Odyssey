import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { supabase } from '@/lib/supabase';
import type { ParsedEventData } from '@/types/agent';

// Declare global type for pending events
declare global {
  var pendingEvents: Map<string, { eventData: ParsedEventData; guildId: string | null }>;
}

export async function handleEventConfirmationButton(interaction: ButtonInteraction) {
  const customIdParts = interaction.customId.split('_');

  // Expected format: event_confirm_yes_userId_timestamp or event_confirm_edit_userId_timestamp
  if (customIdParts[0] !== 'event' || customIdParts[1] !== 'confirm') return;

  const action = customIdParts[2]; // 'yes', 'edit', or 'cancel'
  const confirmationId = `${customIdParts[3]}_${customIdParts[4]}`; // Reconstruct userId_timestamp

  // Retrieve pending event data
  global.pendingEvents = global.pendingEvents || new Map();
  const pendingEvent = global.pendingEvents.get(confirmationId);

  if (!pendingEvent) {
    await interaction.reply({
      content: 'This confirmation has expired. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  const { eventData, guildId } = pendingEvent;

  try {
    if (action === 'yes') {
      // Save to database
      await interaction.deferReply();

      const { data, error } = await supabase
        .from('events')
        .insert({
          guild_id: guildId ?? '',
          channel_id: interaction.channelId ?? '',
          name: eventData.name,
          date: eventData.date?.toISOString().split('T')[0], // Extract date only
          time: eventData.startTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          location: eventData.location,
          event_type: eventData.eventType,
          creation_method: 'nlp',
          enabled_modules: {
            schedule: true,
            attendees: true,
            group_dashboard: false,
            individual_packing: false,
            transportation: false,
            budget: false,
            weather: false,
            photos: false,
          },
          synced_with_discord: false,
          created_by: interaction.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Success embed
      const successEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle(' Event Created!')
        .setDescription(`**${eventData.name}** has been added to your events.`)
        .addFields(
          { name: 'Event ID', value: data.id.toString() }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

      // Clean up pending event
      global.pendingEvents.delete(confirmationId);

    } else if (action === 'edit') {
      // Ask what to edit
      await interaction.reply({
        content: 'What would you like to change? (Reply with your edits, e.g., "change time to 7 PM")',
        ephemeral: true
      });

      // TODO: Implement edit flow (collect message, re-run agent with updated context)

    } else if (action === 'cancel') {
      await interaction.update({
        content: 'L Event creation cancelled.',
        embeds: [],
        components: []
      });
      global.pendingEvents.delete(confirmationId);
    }

  } catch (error) {
    console.error('Error handling confirmation button:', error);

    if (interaction.deferred) {
      await interaction.editReply({
        content: 'Failed to create event. Please try again.'
      });
    } else {
      await interaction.reply({
        content: 'Failed to create event. Please try again.',
        ephemeral: true
      });
    }
  }
}
