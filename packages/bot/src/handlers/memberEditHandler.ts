import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { supabase } from '@/lib/supabase';
import { ROLE_HIERARCHY } from '@/lib/permissions';

export async function handleMemberSelect(interaction: StringSelectMenuInteraction) {
  const sessionId = interaction.customId.split('_').pop();
  const selectedUserId = interaction.values[0];

  if (!sessionId || !selectedUserId) {
    await interaction.reply({
      content: 'Invalid session or no member selected.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  global.memberEditSessions = global.memberEditSessions || new Map();
  const session = global.memberEditSessions.get(sessionId);

  if (!session) {
    await interaction.reply({
      content: 'Session expired. Please run /manage-members again.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.deferUpdate();

  // Fetch event visibility
  const { data: event } = await supabase
    .from('events')
    .select('visibility')
    .eq('id', session.eventId)
    .single();

  const isPrivateEvent = event?.visibility === 'private';

  // Fetch selected member's current data
  const { data: member } = await supabase
    .from('event_members')
    .select('role, rsvp_status')
    .eq('event_id', session.eventId)
    .eq('user_id', selectedUserId)
    .single();

  if (!member) {
    await interaction.editReply({
      content: 'Member not found.',
      components: []
    });
    return;
  }

  // Check if co-host is trying to edit an organizer or another co-host
  if (session.editorRole === 'co_host' && (member.role === 'organizer' || member.role === 'co_host')) {
    await interaction.editReply({
      content: 'Co-hosts can only manage members and viewers, not organizers or other co-hosts. ⚠️',
      embeds: [],
      components: []
    });
    return;
  }

  // Update session with target member data (sessionId is guaranteed to exist from check above)
  session.targetUserId = selectedUserId;
  session.originalRole = member.role;
  session.originalRsvp = member.rsvp_status;
  session.pendingChanges = {};
  (session as any).isPrivateEvent = isPrivateEvent;

  // Fetch member's Discord info
  const guildMember = await interaction.guild!.members.fetch(selectedUserId);

  // Create edit embed (using non-null assertion as we've verified sessionId exists)
  const embed = await createMemberEditEmbed(
    guildMember.displayName,
    member.role,
    member.rsvp_status,
    {},
    sessionId!,
    isPrivateEvent
  );

  const components = createEditButtons(
    sessionId!,
    member.role,
    {},
    session.editorRole,
    session.editorUserId,
    selectedUserId,
    member.rsvp_status,
    isPrivateEvent
  );

  await interaction.editReply({ embeds: [embed], components });
}

export async function handleMemberAction(interaction: ButtonInteraction) {
  const parts = interaction.customId.split('_');
  const action = parts[1]; // promote, demote, remove, rsvp, confirm, back
  const sessionId = parts[parts.length - 1];

  if (!sessionId) {
    await interaction.reply({
      content: 'Invalid session ID.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  global.memberEditSessions = global.memberEditSessions || new Map();
  const session = global.memberEditSessions.get(sessionId);

  if (!session) {
    await interaction.reply({
      content: 'Session expired.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Handle back to list
  if (action === 'back') {
    await interaction.update({
      content: 'Cancelled. Run /manage-members to view the list again.',
      embeds: [],
      components: []
    });
    global.memberEditSessions.delete(sessionId);
    return;
  }

  // Handle confirm - apply all pending changes
  if (action === 'confirm') {
    await interaction.deferUpdate();

    try {
      const { pendingChanges, targetUserId, eventId, editorUserId } = session;

      if (pendingChanges.remove) {
        const isPrivateEvent = (session as any).isPrivateEvent;

        console.log('Removing user:', targetUserId, 'from event:', eventId, 'isPrivate:', isPrivateEvent);

        if (isPrivateEvent) {
          // Private event: fully remove from event_members and event_access
          const { error: memberDeleteError } = await supabase
            .from('event_members')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', targetUserId);

          console.log('Deleted from event_members, error:', memberDeleteError);

          // Remove from event_access table as well
          const { error: accessDeleteError } = await supabase
            .from('event_access')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', targetUserId)
            .eq('access_type', 'user');

          console.log('Deleted from event_access, error:', accessDeleteError);
        } else {
          // Public event: demote members/co-hosts to viewer (viewers can't be removed)
          await supabase
            .from('event_members')
            .update({ role: 'viewer', rsvp_status: null })
            .eq('event_id', eventId)
            .eq('user_id', targetUserId);
        }
      } else if (pendingChanges.transferOrganizer && pendingChanges.role === 'organizer') {
        // Handle organizer transfer atomically
        // Step 1: Demote current organizer (editor) to co_host
        const { error: demoteError } = await supabase
          .from('event_members')
          .update({ role: 'co_host' })
          .eq('event_id', eventId)
          .eq('user_id', editorUserId);

        if (demoteError) {
          throw new Error('Failed to demote current organizer: ' + demoteError.message);
        }

        // Step 2: Promote target to organizer (always RSVP as 'yes')
        const updates: any = { role: 'organizer', rsvp_status: 'yes' };

        const { error: promoteError } = await supabase
          .from('event_members')
          .update(updates)
          .eq('event_id', eventId)
          .eq('user_id', targetUserId);

        if (promoteError) {
          // Rollback: Re-promote editor back to organizer
          await supabase
            .from('event_members')
            .update({ role: 'organizer' })
            .eq('event_id', eventId)
            .eq('user_id', editorUserId);

          throw new Error('Failed to promote new organizer: ' + promoteError.message);
        }
      } else {
        // Regular update (role and/or RSVP)
        const updates: any = {};
        if (pendingChanges.role) updates.role = pendingChanges.role;
        if (pendingChanges.rsvpStatus) updates.rsvp_status = pendingChanges.rsvpStatus;

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('event_members')
            .update(updates)
            .eq('event_id', eventId)
            .eq('user_id', targetUserId);
        }
      }

      // Success message (Screen 3 - replaces Screen 2)
      let successMessage = 'Member updated successfully. ✅';

      if (pendingChanges.transferOrganizer) {
        successMessage = 'Organizer transferred successfully. You are now a Co-Host. ✅';
      } else if (pendingChanges.remove) {
        const isPrivateEvent = (session as any).isPrivateEvent;
        if (isPrivateEvent) {
          successMessage = session.originalRole === 'viewer'
            ? 'User removed and view access revoked. ✅'
            : 'Member removed and view access revoked. ✅';
        } else {
          // Public event: only members/co-hosts can be removed (demoted to viewer)
          successMessage = 'Member removed and demoted to viewer. ✅';
        }
      }

      await interaction.editReply({
        content: successMessage,
        embeds: [],
        components: []
      });

      global.memberEditSessions.delete(sessionId);

    } catch (error) {
      console.error('Error updating member:', error);
      await interaction.editReply({
        content: 'Failed to update member. Please try again.',
        embeds: [],
        components: []
      });
    }

    return;
  }

  // Handle other actions (promote, demote, remove, rsvp)
  await interaction.deferUpdate();

  const currentRole = session.pendingChanges.role || session.originalRole;
  const currentRsvp = session.pendingChanges.rsvpStatus || session.originalRsvp;

  // Process actions (co-hosts blocked from editing organizers/co-hosts at selection stage)
  if (action === 'promote') {
    if (currentRole === 'viewer') {
      const newRole = 'member';
      // If promoting back to original role, clear the pending change
      if (newRole === session.originalRole) {
        delete session.pendingChanges.role;
        delete session.pendingChanges.transferOrganizer;
      } else {
        session.pendingChanges.role = newRole;
      }
    } else if (currentRole === 'member') {
      const newRole = 'co_host';
      if (newRole === session.originalRole) {
        delete session.pendingChanges.role;
        delete session.pendingChanges.transferOrganizer;
      } else {
        session.pendingChanges.role = newRole;
      }
    } else if (currentRole === 'co_host') {
      // Only organizers can promote to organizer
      if (session.editorRole === 'organizer') {
        // Show transfer warning
        const guildMember = await interaction.guild!.members.fetch(session.targetUserId);
        await interaction.followUp({
          content: `⚠️ **Warning: Organizer Transfer**\n\nPromoting **${guildMember.displayName}** to Organizer will automatically demote you to Co-Host.\n\n**You will lose your organizer privileges and ${guildMember.displayName} will become the new event organizer.**\n\nAre you sure you want to proceed? If yes, click **Confirm Changes**.`,
          flags: MessageFlags.Ephemeral
        });

        // Mark that we need to transfer (will be handled in confirm)
        session.pendingChanges.role = 'organizer';
        session.pendingChanges.transferOrganizer = true;
      }
    }
  } else if (action === 'demote') {
    if (currentRole === 'co_host') {
      const newRole = 'member';
      // If demoting back to original role, clear the pending change
      if (newRole === session.originalRole) {
        delete session.pendingChanges.role;
        delete session.pendingChanges.transferOrganizer;
      } else {
        session.pendingChanges.role = newRole;
      }
    } else if (currentRole === 'member') {
      const newRole = 'viewer';
      if (newRole === session.originalRole) {
        delete session.pendingChanges.role;
        delete session.pendingChanges.transferOrganizer;
      } else {
        session.pendingChanges.role = newRole;
      }
    }
  } else if (action === 'remove') {
    // For organizers, show transfer flow
    if (currentRole === 'organizer') {
      // Fetch co-hosts to show options
      const { data: coHosts } = await supabase
        .from('event_members')
        .select('user_id, role')
        .eq('event_id', session.eventId)
        .eq('role', 'co_host');

      if (!coHosts || coHosts.length === 0) {
        await interaction.followUp({
          content: '⚠️ **Cannot Remove Organizer**\n\nTo leave this event as organizer, you must first promote a co-host to organizer. There are currently no co-hosts to transfer to.\n\nPlease add and/or promote a member to co-host first, then promote them to organizer.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Show transfer warning similar to promote flow
      await interaction.followUp({
        content: `⚠️ **Warning: Organizer Transfer Required**\n\nTo remove yourself as organizer, you must first transfer organizer privileges to a co-host.\n\nPlease go back and promote a co-host to organizer; this will demote you to a co-host, and you can safely remove yourself.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    session.pendingChanges.remove = true;
  } else if (action === 'yes' || action === 'maybe') {
    // If clicking the same RSVP as original, clear the pending change
    if (action === session.originalRsvp) {
      delete session.pendingChanges.rsvpStatus;
    } else {
      session.pendingChanges.rsvpStatus = action;
    }
  }

  // Fetch member's Discord info
  const guildMember = await interaction.guild!.members.fetch(session.targetUserId);

  // Update embed with pending changes
  const updatedRole = session.pendingChanges.role || session.originalRole;
  const updatedRsvp = session.pendingChanges.rsvpStatus || session.originalRsvp;

  // Using non-null assertion as we've verified sessionId exists above
  const embed = await createMemberEditEmbed(
    guildMember.displayName,
    session.originalRole,
    session.originalRsvp,
    session.pendingChanges,
    sessionId!,
    (session as any).isPrivateEvent
  );

  const components = createEditButtons(
    sessionId!,
    updatedRole,
    session.pendingChanges,
    session.editorRole,
    session.editorUserId,
    session.targetUserId,
    session.originalRsvp,
    (session as any).isPrivateEvent
  );

  await interaction.editReply({ embeds: [embed], components });
}

// Helper: Create member edit embed
async function createMemberEditEmbed(
  displayName: string,
  originalRole: string,
  originalRsvp: string,
  pendingChanges: any,
  sessionId: string,
  isPrivateEvent: boolean = false
) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`Managing: ${displayName}`)
    .setTimestamp();

  let description = '**Current Status:**\n';

  // Show role changes
  if (pendingChanges.role) {
    description += `Role: ${originalRole} → **${pendingChanges.role}** ⚠️\n`;
  } else {
    description += `Role: ${originalRole}\n`;
  }

  // Show RSVP changes
  if (pendingChanges.rsvpStatus) {
    const rsvpEmoji = pendingChanges.rsvpStatus === 'yes' ? '✅' : pendingChanges.rsvpStatus === 'maybe' ? '❓' : '❌';
    const origRsvpEmoji = originalRsvp === 'yes' ? '✅' : originalRsvp === 'maybe' ? '❓' : originalRsvp === null ? '⏳' : '❌';
    const origRsvpText = originalRsvp === null ? 'pending' : originalRsvp;
    description += `RSVP: ${origRsvpEmoji} ${origRsvpText} → **${rsvpEmoji} ${pendingChanges.rsvpStatus}** ⚠️\n`;
  } else {
    const rsvpEmoji = originalRsvp === 'yes' ? '✅' : originalRsvp === 'maybe' ? '❓' : originalRsvp === null ? '⏳' : '❌';
    const rsvpText = originalRsvp === null ? 'pending' : originalRsvp;
    description += `RSVP: ${rsvpEmoji} ${rsvpText}\n`;
  }

  if (pendingChanges.remove) {
    if (isPrivateEvent) {
      // Private event removal messages
      if (originalRole === 'viewer') {
        description += '\n⚠️ **This user will lose view access**';
      } else {
        description += '\n⚠️ **This member will be REMOVED and will lose view access**';
      }
    } else {
      // Public event removal messages (viewers can't be removed from public events)
      description += '\n⚠️ **This member will be REMOVED and become a viewer**';
    }
  }

  if (Object.keys(pendingChanges).length > 0 && !pendingChanges.remove) {
    description += '\n⚠️ Pending changes - click Confirm to apply';
  }

  embed.setDescription(description);

  return embed;
}

// Helper: Create edit action buttons
function createEditButtons(
  sessionId: string,
  currentRole: string,
  pendingChanges: any,
  editorRole: string,
  editorUserId: string,
  targetUserId: string,
  originalRsvp: string,
  isPrivateEvent: boolean = false
) {
  const row1 = new ActionRowBuilder<ButtonBuilder>();
  const row2 = new ActionRowBuilder<ButtonBuilder>();
  const row3 = new ActionRowBuilder<ButtonBuilder>();

  const isEditingSelf = editorUserId === targetUserId;

  // Simple button enable/disable logic
  // Co-hosts can only promote viewers to members (not members to co-hosts)
  const canPromote = (currentRole === 'viewer') ||
                     (currentRole === 'member' && editorRole === 'organizer') ||
                     (currentRole === 'co_host' && editorRole === 'organizer');
  // Cannot demote yourself, and co-hosts can only demote members to viewers
  const canDemote = !isEditingSelf &&
                    ((currentRole === 'member' && editorRole === 'co_host') ||
                     (currentRole === 'member' && editorRole === 'organizer') ||
                     (currentRole === 'co_host' && editorRole === 'organizer'));

  if (!pendingChanges.remove) {
    // Row 1: Promote/Demote
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`member_promote_${sessionId}`)
        .setLabel('⬆️ Promote')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!canPromote)
    );

    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`member_demote_${sessionId}`)
        .setLabel('⬇️ Demote')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!canDemote)
    );

    // Row 2: RSVP actions (Yes/Maybe) + Remove button
    const actualCurrentRsvp = pendingChanges.rsvpStatus !== undefined
      ? pendingChanges.rsvpStatus
      : originalRsvp;

    // RSVP buttons should be disabled for viewers
    const isViewer = currentRole === 'viewer';

    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(`member_yes_${sessionId}`)
        .setLabel('✅ Yes')
        .setStyle(actualCurrentRsvp === 'yes' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(isViewer),
      new ButtonBuilder()
        .setCustomId(`member_maybe_${sessionId}`)
        .setLabel('❓ Maybe')
        .setStyle(actualCurrentRsvp === 'maybe' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(isViewer),
      new ButtonBuilder()
        .setCustomId(`member_remove_${sessionId}`)
        .setLabel('🗑️ Remove')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(currentRole === 'viewer' && !isPrivateEvent)
    );
  }

  // Row 3: Confirm/Cancel
  row3.addComponents(
    new ButtonBuilder()
      .setCustomId(`member_confirm_${sessionId}`)
      .setLabel('✔️ Confirm Changes')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`member_back_${sessionId}`)
      .setLabel('↩️ Cancel')
      .setStyle(ButtonStyle.Secondary)
  );

  if (pendingChanges.remove) {
    return [row3];
  }

  return [row1, row2, row3];
}
