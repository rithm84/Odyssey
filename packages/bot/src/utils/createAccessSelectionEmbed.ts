import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  Guild,
  StringSelectMenuOptionBuilder
} from 'discord.js';

/**
 * Creates the embed and components for selecting access (roles/users) for a private event
 * @param eventName - Name of the event being created
 * @param guild - Discord guild to fetch roles and members from
 * @param sessionId - Session identifier for the confirmation
 * @param accessList - Currently selected roles and users
 * @returns Object containing the embed and action rows (dropdowns + buttons)
 */
export async function createAccessSelectionEmbed(
  eventName: string,
  guild: Guild,
  sessionId: string,
  accessList: Array<{ type: 'role' | 'user'; id: string; name: string }> = []
) {
  // Build embed
  const embed = new EmbedBuilder()
    .setColor('#F59E0B') // Orange/amber color for private events
    .setTitle('🔒 Private Event Access')
    .setDescription(
      `**Event:** ${eventName}\n\n` +
      `Select who can view this private event using the dropdowns below.\n` +
      `You can grant access by **roles** (recommended) or specific **users**.`
    )
    .setTimestamp();

  // Show selected access list
  if (accessList.length > 0) {
    const roleAccess = accessList.filter(a => a.type === 'role');
    const userAccess = accessList.filter(a => a.type === 'user');

    let accessDisplay = '';

    if (roleAccess.length > 0) {
      accessDisplay += '**Roles:**\n' + roleAccess.map(a => `• @${a.name}`).join('\n') + '\n\n';
    }

    if (userAccess.length > 0) {
      accessDisplay += '**Users:**\n' + userAccess.map(a => `• @${a.name}`).join('\n');
    }

    embed.addFields({
      name: '✅ Selected Access',
      value: accessDisplay,
      inline: false
    });
  } else {
    embed.addFields({
      name: '⚠️ No Access Selected',
      value: 'Only you (the organizer) will be able to see this event until you add roles or users.',
      inline: false
    });
  }

  // Create role dropdown - fetch all roles except @everyone
  const roles = guild.roles.cache
    .filter(role => role.name !== '@everyone')
    .sort((a, b) => b.position - a.position) // Sort by position (highest first)
    .map(role => role);

  const roleOptions = roles.slice(0, 25).map(role =>
    new StringSelectMenuOptionBuilder()
      .setLabel(role.name)
      .setValue(role.id)
      .setDescription(`Grant access to ${role.name} role`)
      .setDefault(accessList.some(a => a.type === 'role' && a.id === role.id))
  );

  const roleDropdown = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`access_select_roles_${sessionId}`)
        .setPlaceholder('➕ Select roles to grant access')
        .setMinValues(0)
        .setMaxValues(Math.min(roleOptions.length, 25))
        .addOptions(roleOptions)
    );

  // Create user dropdown - fetch guild members (limit to 25 for Discord API)
  const members = await guild.members.fetch({ limit: 25 });
  const userOptions = members
    .filter(member => !member.user.bot) // Exclude bots
    .map(member =>
      new StringSelectMenuOptionBuilder()
        .setLabel(member.displayName)
        .setValue(member.id)
        .setDescription(`Grant access to ${member.user.username}`)
        .setDefault(accessList.some(a => a.type === 'user' && a.id === member.id))
    )
    .slice(0, 25);

  const userDropdown = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`access_select_users_${sessionId}`)
        .setPlaceholder('➕ Select users to grant access')
        .setMinValues(0)
        .setMaxValues(Math.min(userOptions.length, 25))
        .addOptions(userOptions)
    );

  // Create action buttons
  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`access_confirm_${sessionId}`)
        .setLabel('✅ Confirm Access')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`access_back_${sessionId}`)
        .setLabel('↩️ Back to Event')
        .setStyle(ButtonStyle.Secondary)
    );

  return {
    embed,
    components: [roleDropdown, userDropdown, buttons]
  };
}
