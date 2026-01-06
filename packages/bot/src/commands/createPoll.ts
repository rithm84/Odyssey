import { SlashCommandBuilder } from 'discord.js';

export const createPollCommand = new SlashCommandBuilder()
  .setName('create-poll')
  .setDescription('Create a poll for your event or server')
  .addStringOption(option =>
    option
      .setName('description')
      .setDescription('Describe your poll (e.g., "when can people meet next week for 2 hours?")')
      .setRequired(true)
  );
