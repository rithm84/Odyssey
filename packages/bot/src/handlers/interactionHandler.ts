import type { Interaction } from 'discord.js';
import { pingCommand } from '../commands/ping.js';

export async function handleInteraction(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
  
    if (interaction.commandName === 'ping') {
      await pingCommand.execute(interaction);
    }
}