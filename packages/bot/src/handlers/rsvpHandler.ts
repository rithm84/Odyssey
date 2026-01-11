import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { supabase } from '@/lib/supabase';

type RsvpStatus = 'yes' | 'maybe';

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

    // Check if user is currently a member
    const { data: existingMember } = await supabase
      .from('event_members')
      .select('role, rsvp_status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    let isNewMember = false;
    let alreadyHadStatus = false;

    if (!existingMember) {
      // User is a viewer (not in event_members table) - create member record
      const { error: insertError } = await supabase
        .from('event_members')
        .insert({
          event_id: eventId,
          user_id: userId,
          role: 'member',
          rsvp_status: status
        });

      if (insertError) throw insertError;
      isNewMember = true;
    } else {
      // Check if they already have this exact RSVP status
      if (existingMember.rsvp_status === status) {
        alreadyHadStatus = true;
      } else {
        // User is already a member - update RSVP status
        const { error: updateError } = await supabase
          .from('event_members')
          .update({ rsvp_status: status })
          .eq('event_id', eventId)
          .eq('user_id', userId);

        if (updateError) throw updateError;
      }
    }

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
      maybe: '❓'
    };

    const statusText = {
      yes: 'attending',
      maybe: 'maybe attending'
    };

    // Determine title and description based on state
    let title: string;
    let description: string;

    if (alreadyHadStatus) {
      // User already has this RSVP status
      const roleText = existingMember?.role === 'organizer' ? ' as the organizer' : '';
      title = `${statusEmoji[status]} Already Marked`;
      description = `You're already marked as **${statusText[status]}** for **${event.name}**${roleText}.`;
    } else if (isNewMember) {
      // User just joined the event
      title = `${statusEmoji[status]} Joined Event!`;
      description = `You've joined **${event.name}** and RSVP'd as **${statusText[status]}**!`;
    } else {
      // User updated their RSVP
      title = `${statusEmoji[status]} RSVP Updated`;
      description = `You're now marked as **${statusText[status]}** for **${event.name}**`;
    }

    const embed = new EmbedBuilder()
      .setColor(status === 'yes' ? '#57F287' : '#FEE75C') // Green for yes, yellow for maybe
      .setTitle(title)
      .setDescription(description)
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
