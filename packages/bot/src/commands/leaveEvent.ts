import { SlashCommandBuilder } from 'discord.js';

export const leaveEventCommand = new SlashCommandBuilder()
  .setName('leave-event')
  .setDescription('Leave an event you\'re a member of')
  .addStringOption(option =>
    option
      .setName('event')
      .setDescription('Select the event to leave')
      .setRequired(true)
      .setAutocomplete(true)
  );
