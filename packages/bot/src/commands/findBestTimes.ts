import { SlashCommandBuilder } from 'discord.js';

export const findBestTimesCommand = new SlashCommandBuilder()
  .setName('find-best-times')
  .setDescription('Find the best times for an availability poll')
  .addStringOption(option =>
    option
      .setName('poll')
      .setDescription('Select an availability poll')
      .setRequired(true)
      .setAutocomplete(true)
  );
