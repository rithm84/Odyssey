import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { supabase } from '@/lib/supabase';
import { checkEventPermission } from '@/lib/permissions';
import { generateUniqueSessionId } from '@/utils/generateSessionId';
import { createMemberListEmbed } from '@/utils/createMemberListEmbed';

// Declare global type for member edit sessions
declare global {
  var memberEditSessions: Map<string, {
    eventId: string;
    eventName: string;
    targetUserId: string;
    originalRole: string;
    originalRsvp: string;
    pendingChanges: {
      role?: string;
      rsvpStatus?: string;
      remove?: boolean;
      transferOrganizer?: boolean;
    };
    editorUserId: string;
    editorRole: string; // Role of the person doing the editing
    timestamp: number;
  }>;
}

export async function handleManageMembers(interaction: ChatInputCommandInteraction) {
  const eventId = interaction.options.getString('event', true);
  const userId = interaction.user.id;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Check if user has permission (co_host or organizer)
    const hasPermission = await checkEventPermission(interaction, eventId, 'co_host');
    if (!hasPermission) {
      return; // Error message already sent
    }

    // Get editor's role for permission checks later
    const { data: editorMember } = await supabase
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    const editorRole = editorMember?.role || 'member';

    // Fetch event info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('name')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      await interaction.editReply({
        content: 'Event not found.'
      });
      return;
    }

    // Fetch all members for this event
    const { data: members, error: membersError } = await supabase
      .from('event_members')
      .select('user_id, role, rsvp_status, joined_at')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: true });

    if (membersError || !members || members.length === 0) {
      await interaction.editReply({
        content: 'No members found for this event.'
      });
      return;
    }

    // Generate session ID for tracking
    global.memberEditSessions = global.memberEditSessions || new Map();
    const sessionId = generateUniqueSessionId(global.memberEditSessions);

    // Create member list embed
    const { embed, components } = await createMemberListEmbed(
      event.name,
      members,
      interaction.guild!,
      sessionId
    );

    // Store minimal session data (we'll create full session when user selects a member)
    global.memberEditSessions.set(sessionId, {
      eventId,
      eventName: event.name,
      targetUserId: '', // Will be set when user selects
      originalRole: '',
      originalRsvp: '',
      pendingChanges: {},
      editorUserId: userId,
      editorRole: editorRole, // Store editor's role for permission checks
      timestamp: Date.now()
    });

    await interaction.editReply({ embeds: [embed], components });

  } catch (error) {
    console.error('Error managing members:', error);
    await interaction.editReply({
      content: 'Failed to load members. Please try again.'
    });
  }
}
