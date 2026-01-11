import {
  ButtonInteraction,
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { supabase } from '@/lib/supabase';
import { generateUniqueSessionId } from '@/utils/generateSessionId';

// Global type for add member sessions
declare global {
  var addMemberSessions: Map<string, {
    eventId: string;
    eventName: string;
    selectedUserId?: string;
    selectedRole?: string;
    selectedRsvp?: string;
    originalSessionId: string;
    cachedMembers?: Array<{ id: string; displayName: string; tag: string }>; // Cache to avoid timeout
  }>;
}

export async function handleAddMemberButton(interaction: ButtonInteraction) {
  const originalSessionId = interaction.customId.split('_').pop();

  if (!originalSessionId) {
    await interaction.reply({
      content: 'Invalid session ID.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  global.memberEditSessions = global.memberEditSessions || new Map();
  const session = global.memberEditSessions.get(originalSessionId);

  if (!session) {
    await interaction.reply({
      content: 'Session expired. Please run /manage-members again.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Fetch all guild members
    const guildMembers = await interaction.guild!.members.fetch();

    // Filter out bots and existing event members
    const { data: existingMembers } = await supabase
      .from('event_members')
      .select('user_id')
      .eq('event_id', session.eventId);

    const existingUserIds = new Set(existingMembers?.map(m => m.user_id) || []);

    const availableMembers = Array.from(guildMembers.values())
      .filter(m => !m.user.bot && !existingUserIds.has(m.id))
      .slice(0, 25); // Discord select menu limit

    if (availableMembers.length === 0) {
      await interaction.editReply({
        content: 'No available members to add. All server members are either bots or already in this event.'
      });
      return;
    }

    // Cache member data to avoid re-fetching (prevents timeout)
    const cachedMembers = availableMembers.map(m => ({
      id: m.id,
      displayName: m.displayName,
      tag: m.user.tag
    }));

    // Create new add member session
    global.addMemberSessions = global.addMemberSessions || new Map();
    const addSessionId = generateUniqueSessionId(global.addMemberSessions);

    global.addMemberSessions.set(addSessionId, {
      eventId: session.eventId,
      eventName: session.eventName,
      selectedRole: 'member',
      selectedRsvp: 'yes', // Default to 'yes' (no 'no' option anymore)
      originalSessionId,
      cachedMembers // Store cached member list
    });

    // Create embed and select menus
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`➕ Add Member to ${session.eventName}`)
      .setDescription('Select a member and configure their role and RSVP status.')
      .setTimestamp();

    // Member select menu
    const memberSelect = new StringSelectMenuBuilder()
      .setCustomId(`add_member_user_${addSessionId}`)
      .setPlaceholder('Select a member to add...')
      .addOptions(
        availableMembers.map(member => ({
          label: member.displayName,
          description: member.user.tag,
          value: member.id
        }))
      );

    // Role select menu
    const roleSelect = new StringSelectMenuBuilder()
      .setCustomId(`add_member_role_${addSessionId}`)
      .setPlaceholder('Select role (default: member)')
      .addOptions([
        { label: 'Member', value: 'member', description: 'Regular event participant', default: true },
        { label: 'Co-Host', value: 'co_host', description: 'Can manage event settings' },
        { label: 'Viewer', value: 'viewer', description: 'Read-only access' }
      ]);

    // RSVP select menu (only Yes/Maybe - viewers don't need RSVP)
    const rsvpSelect = new StringSelectMenuBuilder()
      .setCustomId(`add_member_rsvp_${addSessionId}`)
      .setPlaceholder('Select RSVP status (default: yes)')
      .addOptions([
        { label: '✅ Yes - Attending', value: 'yes', default: true },
        { label: '❓ Maybe - Unsure', value: 'maybe' }
      ]);

    // Confirm/Cancel buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`add_member_confirm_${addSessionId}`)
          .setLabel('✔️ Add Member')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`add_member_cancel_${addSessionId}`)
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(memberSelect);
    const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleSelect);
    const row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(rsvpSelect);

    await interaction.editReply({
      embeds: [embed],
      components: [row1, row2, row3, buttons]
    });
  } catch (error) {
    console.error('Error in add member flow:', error);
    await interaction.editReply({
      content: 'Failed to create add member interface. Please try again. ❌'
    });
  }
}

// Handle select menu interactions for adding member
export async function handleAddMemberSelect(interaction: StringSelectMenuInteraction) {
  const parts = interaction.customId.split('_');
  const field = parts[2]; // 'user', 'role', or 'rsvp'
  const sessionId = parts[parts.length - 1];

  if (!sessionId) return;

  global.addMemberSessions = global.addMemberSessions || new Map();
  const session = global.addMemberSessions.get(sessionId);

  if (!session) {
    await interaction.reply({
      content: 'Session expired.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const selectedValue = interaction.values[0];

  // Update session based on which select menu was used
  if (field === 'user' && selectedValue) {
    session.selectedUserId = selectedValue;
    await interaction.deferUpdate();
  } else if (field === 'role' && selectedValue) {
    session.selectedRole = selectedValue;

    // Defer update first to prevent timeout
    await interaction.deferUpdate();

    // Dynamically rebuild components based on role selection
    await rebuildAddMemberComponents(interaction, session, sessionId);
  } else if (field === 'rsvp' && selectedValue) {
    session.selectedRsvp = selectedValue;
    await interaction.deferUpdate();
  }
}

// Helper function to rebuild add member components
async function rebuildAddMemberComponents(
  interaction: StringSelectMenuInteraction,
  session: any,
  sessionId: string
) {
  try {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`➕ Add Member to ${session.eventName}`)
      .setDescription(
        session.selectedRole === 'viewer'
          ? 'Select a member and configure their role. Viewers do not have RSVP status.'
          : 'Select a member and configure their role and RSVP status.'
      )
      .setTimestamp();

    // Use cached member list to avoid timeout
    const availableMembers = session.cachedMembers || [];

    if (availableMembers.length === 0) {
      await interaction.editReply({
        content: 'No available members found. Please try again.',
        embeds: [],
        components: []
      });
      return;
    }

    // Member select menu
    const memberSelect = new StringSelectMenuBuilder()
      .setCustomId(`add_member_user_${sessionId}`)
      .setPlaceholder('Select a member to add...')
      .addOptions(
        availableMembers.map((member: any) => ({
          label: member.displayName,
          description: member.tag,
          value: member.id,
          default: member.id === session.selectedUserId
        }))
      );

    // Role select menu
    const roleSelect = new StringSelectMenuBuilder()
      .setCustomId(`add_member_role_${sessionId}`)
      .setPlaceholder('Select role (default: member)')
      .addOptions([
        { label: 'Member', value: 'member', description: 'Regular event participant', default: session.selectedRole === 'member' },
        { label: 'Co-Host', value: 'co_host', description: 'Can manage event settings', default: session.selectedRole === 'co_host' },
        { label: 'Viewer', value: 'viewer', description: 'Read-only access', default: session.selectedRole === 'viewer' }
      ]);

    // Confirm/Cancel buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`add_member_confirm_${sessionId}`)
          .setLabel('✔️ Add Member')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`add_member_cancel_${sessionId}`)
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(memberSelect);
    const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleSelect);

    // RSVP row - show actual options for non-viewers, disabled placeholder for viewers
    let row3: ActionRowBuilder<StringSelectMenuBuilder>;

    if (session.selectedRole !== 'viewer') {
      const rsvpSelect = new StringSelectMenuBuilder()
        .setCustomId(`add_member_rsvp_${sessionId}`)
        .setPlaceholder('Select RSVP status (default: yes)')
        .addOptions([
          { label: '✅ Yes - Attending', value: 'yes', default: session.selectedRsvp === 'yes' },
          { label: '❓ Maybe - Unsure', value: 'maybe', default: session.selectedRsvp === 'maybe' }
        ]);

      row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(rsvpSelect);
    } else {
      // Viewer - show disabled placeholder
      const rsvpPlaceholder = new StringSelectMenuBuilder()
        .setCustomId(`add_member_rsvp_disabled_${sessionId}`)
        .setPlaceholder('Viewers do not have RSVP status')
        .setDisabled(true)
        .addOptions([
          { label: 'N/A - Viewer role', value: 'na' }
        ]);

      row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(rsvpPlaceholder);
    }

    await interaction.editReply({
      embeds: [embed],
      components: [row1, row2, row3, buttons]
    });
  } catch (error) {
    console.error('Error rebuilding add member components:', error);
  }
}

// Handle confirm/cancel buttons for adding member
export async function handleAddMemberConfirm(interaction: ButtonInteraction) {
  const parts = interaction.customId.split('_');
  const action = parts[2]; // 'confirm' or 'cancel'
  const sessionId = parts[parts.length - 1];

  if (!sessionId) return;

  global.addMemberSessions = global.addMemberSessions || new Map();
  const session = global.addMemberSessions.get(sessionId);

  if (!session) {
    await interaction.reply({
      content: 'Session expired.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (action === 'cancel') {
    await interaction.update({
      content: 'Cancelled adding member.',
      embeds: [],
      components: []
    });
    global.addMemberSessions.delete(sessionId);
    return;
  }

  // Confirm - add the member
  await interaction.deferUpdate();

  try {
    if (!session.selectedUserId) {
      await interaction.editReply({
        content: 'Please select a member first. ❌',
        embeds: [],
        components: []
      });
      return;
    }

    const userId = session.selectedUserId;
    const role = session.selectedRole || 'member';
    const rsvp = session.selectedRsvp || 'yes';

    // Check if user is already a member (double-check)
    const { data: existingMember } = await supabase
      .from('event_members')
      .select('id')
      .eq('event_id', session.eventId)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      await interaction.editReply({
        content: 'This user is already a member of the event. ❌',
        embeds: [],
        components: []
      });
      global.addMemberSessions.delete(sessionId);
      return;
    }

    // Add member to event
    // Viewers don't have RSVP status (set to null)
    const { error } = await supabase
      .from('event_members')
      .insert({
        event_id: session.eventId,
        user_id: userId,
        role: role,
        rsvp_status: role === 'viewer' ? null : rsvp
      });

    if (error) throw error;

    const guildMember = await interaction.guild!.members.fetch(userId);

    const successMessage = role === 'viewer'
      ? `Added **${guildMember.displayName}** as ${role}. ✅`
      : `Added **${guildMember.displayName}** as ${role} with RSVP: ${rsvp}. ✅`;

    await interaction.editReply({
      content: successMessage,
      embeds: [],
      components: []
    });

    global.addMemberSessions.delete(sessionId);

  } catch (error) {
    console.error('Error adding member:', error);
    await interaction.editReply({
      content: 'Failed to add member. Please try again. ❌',
      embeds: [],
      components: []
    });
  }
}
