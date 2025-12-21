import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { supabase } from '@/lib/supabase';
import type { ParsedEventData } from '@/types/agent';

// Re-declare global type for pending events
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

      // Convert string dates back to Date objects if needed (from JSON parsing)
      const date = eventData.date ? new Date(eventData.date) : null;
      const startTime = eventData.startTime ? new Date(eventData.startTime) : null;
      const endTime = eventData.endTime ? new Date(eventData.endTime) : null;

      // Format date as YYYY-MM-DD in local timezone (not UTC)
      const formatLocalDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const { data, error } = await supabase
        .from('events')
        .insert({
          guild_id: guildId ?? '',
          channel_id: interaction.channelId ?? '',
          name: eventData.name,
          date: date ? formatLocalDate(date) : null,
          time: startTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
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
