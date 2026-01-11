import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { supabase } from '@/lib/supabase';

export async function handleLeaveEvent(interaction: ChatInputCommandInteraction) {
  const eventId = interaction.options.getString('event', true);
  const userId = interaction.user.id;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Check if user is a member of this event
    const { data: membership } = await supabase
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      await interaction.editReply({
        content: '❌ You are not a member of this event.'
      });
      return;
    }

    // Prevent organizer from leaving
    if (membership.role === 'organizer') {
      await interaction.editReply({
        content: '❌ Organizers cannot leave their events. Transfer the organizer role first using `/manage-members`.'
      });
      return;
    }

    // Delete member record (user reverts to viewer if they have access)
    const { error } = await supabase
      .from('event_members')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error leaving event:', error);
      await interaction.editReply({
        content: '❌ Failed to leave event. Please try again.'
      });
      return;
    }

    await interaction.editReply({
      content: '✅ You\'ve left the event. You can still view event details if you have access.'
    });

  } catch (error) {
    console.error('Error in leave-event handler:', error);
    await interaction.editReply({
      content: '❌ An error occurred. Please try again.'
    });
  }
}
