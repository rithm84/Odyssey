import { SlashCommandBuilder } from 'discord.js';

export const manageMembersCommand = new SlashCommandBuilder()
  .setName('manage-members')
  .setDescription('Manage event members and roles (organizers and co-hosts only)')
  .addStringOption(option =>
    option
      .setName('event')
      .setDescription('Select the event')
      .setRequired(true)
      .setAutocomplete(true)
  );
