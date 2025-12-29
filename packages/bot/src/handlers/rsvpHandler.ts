import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { supabase } from '@/lib/supabase';

type RsvpStatus = 'yes' | 'no' | 'maybe';

export async function handleRsvp(interaction: ChatInputCommandInteraction) {
  const eventId = interaction.options.getString('event', true);
  const status = interaction.options.getString('status', true) as RsvpStatus;
  const userId = interaction.user.id;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      await interaction.editReply({
        content: 'Event not found.'
      });
      return;
    }

    // Upsert the event member record with RSVP status
    // If user is not a member, they get added with role='member'
    // If user is already a member, just update their rsvp_status
    const { error: upsertError } = await supabase
      .from('event_members')
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          rsvp_status: status,
          // role will default to 'member' on INSERT (not updated on conflict)
        },
        {
          onConflict: 'event_id,user_id',
          ignoreDuplicates: false
        }
      );

    if (upsertError) throw upsertError;

    // Get updated RSVP counts
    const { data: counts } = await supabase
      .from('event_members')
      .select('rsvp_status')
      .eq('event_id', eventId);

    const yesCount = counts?.filter(m => m.rsvp_status === 'yes').length || 0;
    const maybeCount = counts?.filter(m => m.rsvp_status === 'maybe').length || 0;

    // Create status emoji and message
    const statusEmoji = {
      yes: '✅',
      no: '❌',
      maybe: '❓'
    };

    const statusText = {
      yes: 'attending',
      no: 'not attending',
      maybe: 'maybe attending'
    };

    const embed = new EmbedBuilder()
      .setColor(status === 'yes' ? '#57F287' : status === 'maybe' ? '#FEE75C' : '#ED4245')
      .setTitle(`${statusEmoji[status]} RSVP Updated`)
      .setDescription(
        `You're now marked as **${statusText[status]}** for **${event.name}**`
      )
      .addFields(
        {
          name: '📊 Current Attendance',
          value: `✅ Confirmed: ${yesCount}\n❓ Maybe: ${maybeCount}`,
          inline: false
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error handling RSVP:', error);
    await interaction.editReply({
      content: 'Failed to update RSVP. Please try again.'
    });
  }
}
