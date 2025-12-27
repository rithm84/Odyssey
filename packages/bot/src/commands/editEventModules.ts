import { SlashCommandBuilder } from 'discord.js';

export const editEventModulesCommand = new SlashCommandBuilder()
  .setName('edit-event-modules')
  .setDescription('Edit which modules are enabled for an event')
  .addStringOption(option =>
    option
      .setName('event')
      .setDescription('Select the event to edit')
      .setRequired(true)
      .setAutocomplete(true) // Enable autocomplete
  );
