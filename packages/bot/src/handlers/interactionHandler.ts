import type { Interaction } from 'discord.js';

export async function handleInteraction(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
  
    if (interaction.commandName === 'ping') {
      await interaction.reply('Pong!')
    }
}