import type { Interaction } from 'discord.js';
import { handleCreateEventCommand } from '@/handlers/slashCommandHandler';
import { handleEventConfirmationButton } from '@/handlers/buttonHandler';
import { handleModuleToggle } from '@/handlers/moduleToggleHandler';

export async function handleInteraction(interaction: Interaction) {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'create-event') {
      await handleCreateEventCommand(interaction);
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
  }
}
