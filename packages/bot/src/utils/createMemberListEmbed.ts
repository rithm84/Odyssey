import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, Guild } from 'discord.js';
import { ROLE_HIERARCHY } from '@/lib/permissions';

interface MemberData {
  user_id: string;
  role: string;
  rsvp_status: string;
  joined_at: string;
}

export async function createMemberListEmbed(
  eventName: string,
  members: MemberData[],
  guild: Guild,
  sessionId: string
) {
  // Fetch Discord user info for all members
  const memberPromises = members.map(async (member) => {
    try {
      const guildMember = await guild.members.fetch(member.user_id);
      return {
        ...member,
        username: guildMember.user.username,
        displayName: guildMember.displayName
      };
    } catch {
      return {
        ...member,
        username: 'Unknown User',
        displayName: 'Unknown User'
      };
    }
  });

  const enrichedMembers = await Promise.all(memberPromises);

  // Sort by role hierarchy (organizer first) then by joined date
  const sortedMembers = enrichedMembers.sort((a, b) => {
    const roleA = ROLE_HIERARCHY[a.role as keyof typeof ROLE_HIERARCHY] || 0;
    const roleB = ROLE_HIERARCHY[b.role as keyof typeof ROLE_HIERARCHY] || 0;

    if (roleA !== roleB) {
      return roleB - roleA; // Higher role first
    }

    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  // Count RSVP statuses
  const yesCount = members.filter(m => m.rsvp_status === 'yes').length;
  const maybeCount = members.filter(m => m.rsvp_status === 'maybe').length;
  const noCount = members.filter(m => m.rsvp_status === 'no').length;

  // Group members by role
  const organizers = sortedMembers.filter(m => m.role === 'organizer');
  const coHosts = sortedMembers.filter(m => m.role === 'co_host');
  const regularMembers = sortedMembers.filter(m => m.role === 'member');
  const viewers = sortedMembers.filter(m => m.role === 'viewer');

  // Build embed
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`👥 Managing Members - ${eventName}`)
    .setDescription(
      `**Total Members:** ${members.length} | ✅ ${yesCount} | ❓ ${maybeCount} | ❌ ${noCount}`
    )
    .setTimestamp();

  // Add role sections
  if (organizers.length > 0) {
    const organizerList = organizers.map(m => {
      const rsvpEmoji = m.rsvp_status === 'yes' ? '✅' : m.rsvp_status === 'maybe' ? '❓' : '❌';
      return `• ${m.displayName} — ${rsvpEmoji}`;
    }).join('\n');
    embed.addFields({ name: '🔹 Organizers', value: organizerList, inline: false });
  }

  if (coHosts.length > 0) {
    const coHostList = coHosts.map(m => {
      const rsvpEmoji = m.rsvp_status === 'yes' ? '✅' : m.rsvp_status === 'maybe' ? '❓' : '❌';
      return `• ${m.displayName} — ${rsvpEmoji}`;
    }).join('\n');
    embed.addFields({ name: '🔸 Co-Hosts', value: coHostList, inline: false });
  }

  if (regularMembers.length > 0) {
    const memberList = regularMembers.map(m => {
      const rsvpEmoji = m.rsvp_status === 'yes' ? '✅' : m.rsvp_status === 'maybe' ? '❓' : '❌';
      return `• ${m.displayName} — ${rsvpEmoji}`;
    }).join('\n');
    embed.addFields({ name: '👤 Members', value: memberList, inline: false });
  }

  if (viewers.length > 0) {
    embed.addFields({
      name: '👁️ Viewers',
      value: `(${viewers.length})`,
      inline: false
    });
  }

  // Create select menu for member selection (include all members including viewers)
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`member_select_${sessionId}`)
    .setPlaceholder('Select a member to manage...')
    .addOptions(
      sortedMembers.map(member => ({
        label: member.displayName,
        description: `${member.role}${member.rsvp_status ? ` | RSVP: ${member.rsvp_status}` : ''}`,
        value: member.user_id
      }))
    );

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectMenu);

  // Add Member button
  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`member_add_${sessionId}`)
        .setLabel('➕ Add Member')
        .setStyle(ButtonStyle.Primary)
    );

  return { embed, components: [selectRow, buttonRow] };
}
