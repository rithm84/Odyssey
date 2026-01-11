import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} from 'discord.js';
import { createAccessSelectionEmbed } from '@/utils/createAccessSelectionEmbed';
import { createConfirmationEmbed } from '@/utils/createEventConfirmationEmbed';

/**
 * Handles role selection from the access dropdown
 */
export async function handleAccessRoleSelect(interaction: StringSelectMenuInteraction) {
  const confirmationId = interaction.customId.split('_').pop();

  if (!confirmationId) {
    await interaction.reply({
      content: 'Invalid session. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  // Retrieve pending event data
  global.pendingEvents = global.pendingEvents || new Map();
  const pendingEvent = global.pendingEvents.get(confirmationId);

  if (!pendingEvent) {
    await interaction.reply({
      content: 'This session has expired. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  if (!interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true
    });
    return;
  }

  // Get selected role IDs
  const selectedRoleIds = interaction.values;

  // Remove existing role access from accessList
  pendingEvent.accessList = pendingEvent.accessList.filter(a => a.type !== 'role');

  // Add new role access
  for (const roleId of selectedRoleIds) {
    const role = interaction.guild.roles.cache.get(roleId);
    if (role) {
      pendingEvent.accessList.push({
        type: 'role',
        id: roleId,
        name: role.name
      });
    }
  }

  // Recreate the access selection embed with updated access list
  const { embed, components } = await createAccessSelectionEmbed(
    pendingEvent.eventData.name,
    interaction.guild,
    confirmationId,
    pendingEvent.accessList
  );

  await interaction.update({ embeds: [embed], components });
}

/**
 * Handles user selection from the access dropdown
 */
export async function handleAccessUserSelect(interaction: StringSelectMenuInteraction) {
  const confirmationId = interaction.customId.split('_').pop();

  if (!confirmationId) {
    await interaction.reply({
      content: 'Invalid session. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  // Retrieve pending event data
  global.pendingEvents = global.pendingEvents || new Map();
  const pendingEvent = global.pendingEvents.get(confirmationId);

  if (!pendingEvent) {
    await interaction.reply({
      content: 'This session has expired. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  if (!interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true
    });
    return;
  }

  // Get selected user IDs
  const selectedUserIds = interaction.values;

  // Remove existing user access from accessList
  pendingEvent.accessList = pendingEvent.accessList.filter(a => a.type !== 'user');

  // Add new user access
  for (const userId of selectedUserIds) {
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (member) {
      pendingEvent.accessList.push({
        type: 'user',
        id: userId,
        name: member.displayName
      });
    }
  }

  // Recreate the access selection embed with updated access list
  const { embed, components } = await createAccessSelectionEmbed(
    pendingEvent.eventData.name,
    interaction.guild,
    confirmationId,
    pendingEvent.accessList
  );

  await interaction.update({ embeds: [embed], components });
}

/**
 * Handles "Confirm Access" button - returns to event confirmation with private visibility
 */
export async function handleAccessConfirm(interaction: ButtonInteraction) {
  const confirmationId = interaction.customId.replace('access_confirm_', '');

  if (!confirmationId) {
    await interaction.reply({
      content: 'Invalid session. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  // Retrieve pending event data
  global.pendingEvents = global.pendingEvents || new Map();
  const pendingEvent = global.pendingEvents.get(confirmationId);

  if (!pendingEvent) {
    await interaction.reply({
      content: 'This session has expired. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  // Set visibility to private
  pendingEvent.visibility = 'private';

  // Recreate the confirmation embed with private visibility
  const embed = createConfirmationEmbed(pendingEvent.eventData, 'private');

  // Add info about selected access
  if (pendingEvent.accessList.length > 0) {
    const accessSummary = `Access granted to ${pendingEvent.accessList.length} ${
      pendingEvent.accessList.length === 1 ? 'role/user' : 'roles/users'
    } ✅`;
    embed.setDescription(
      'Would you like me to create this event?\n' + accessSummary + '\n'
    );
  } else {
    embed.setDescription(
      'Would you like me to create this event?\n\n' +
      '⚠️ **Warning:** No roles or users have access yet. ' +
      'Only you (the organizer) will be able to see it. Use `/manage-members` after creation to grant access.'
    );
  }

  // Recreate buttons with "Make Public" label
  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`event_confirm_yes_${confirmationId}`)
        .setLabel('✅ Yes')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`event_confirm_edit_${confirmationId}`)
        .setLabel('✏️ Edit')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`event_confirm_toggle_visibility_${confirmationId}`)
        .setLabel('🔓 Make Public')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`event_confirm_cancel_${confirmationId}`)
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger)
    );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

/**
 * Handles "Back to Event" button - returns to event confirmation with public visibility
 */
export async function handleAccessBack(interaction: ButtonInteraction) {
  const confirmationId = interaction.customId.replace('access_back_', '');

  if (!confirmationId) {
    await interaction.reply({
      content: 'Invalid session. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  // Retrieve pending event data
  global.pendingEvents = global.pendingEvents || new Map();
  const pendingEvent = global.pendingEvents.get(confirmationId);

  if (!pendingEvent) {
    await interaction.reply({
      content: 'This session has expired. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  // Reset to public visibility
  pendingEvent.visibility = 'public';

  // Clear access list
  pendingEvent.accessList = [];

  // Recreate the confirmation embed with public visibility
  const embed = createConfirmationEmbed(pendingEvent.eventData, 'public');

  // Recreate buttons with "Make Private" label
  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`event_confirm_yes_${confirmationId}`)
        .setLabel('✅ Yes')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`event_confirm_edit_${confirmationId}`)
        .setLabel('✏️ Edit')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`event_confirm_toggle_visibility_${confirmationId}`)
        .setLabel('🔒 Make Private')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`event_confirm_cancel_${confirmationId}`)
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger)
    );

  await interaction.update({ embeds: [embed], components: [buttons] });
}
