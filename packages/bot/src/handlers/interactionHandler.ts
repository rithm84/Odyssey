import type { Interaction } from 'discord.js';
import { handleCreateEventCommand } from '@/handlers/slashCommandHandler';
import { handleEditEventModules } from '@/handlers/editEventModulesHandler';
import { handleRsvp } from '@/handlers/rsvpHandler';
import { handleManageMembers } from '@/handlers/manageMembersHandler';
import { handleEventConfirmationButton } from '@/handlers/buttonHandler';
import { handleModuleToggle } from '@/handlers/moduleToggleHandler';
import { handleMemberSelect, handleMemberAction } from '@/handlers/memberEditHandler';
import { handleAddMemberButton, handleAddMemberSelect, handleAddMemberConfirm } from '@/handlers/addMemberHandler';

export async function handleInteraction(interaction: Interaction) {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'create-event') {
      await handleCreateEventCommand(interaction);
      return;
    }

    if (interaction.commandName === 'edit-event-modules') {
      await handleEditEventModules(interaction);
      return;
    }

    if (interaction.commandName === 'rsvp') {
      await handleRsvp(interaction);
      return;
    }

    if (interaction.commandName === 'manage-members') {
      await handleManageMembers(interaction);
      return;
    }
  }

  // Handle select menu interactions
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('member_select_')) {
      await handleMemberSelect(interaction);
      return;
    }

    if (interaction.customId.startsWith('add_member_')) {
      await handleAddMemberSelect(interaction);
      return;
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('event_confirm')) {
      await handleEventConfirmationButton(interaction);
      return;
    }

    if (interaction.customId.startsWith('module_')) {
      await handleModuleToggle(interaction);
      return;
    }

    if (interaction.customId.startsWith('member_add_')) {
      await handleAddMemberButton(interaction);
      return;
    }

    if (interaction.customId.startsWith('add_member_confirm_') || interaction.customId.startsWith('add_member_cancel_')) {
      await handleAddMemberConfirm(interaction);
      return;
    }

    if (interaction.customId.startsWith('member_')) {
      await handleMemberAction(interaction);
      return;
    }
  }
}
