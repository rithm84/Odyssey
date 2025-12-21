import { SlashCommandBuilder } from 'discord.js';

export const createEventCommand = new SlashCommandBuilder()
  .setName('create-event')
  .setDescription('Create a new event using natural language')
  .addStringOption(option =>
    option
      .setName('description')
      .setDescription('Describe your event (e.g., "potluck at my place this Saturday 6pm")')
      .setRequired(true)
  );