import { SlashCommandBuilder } from 'discord.js';

export const rsvpCommand = new SlashCommandBuilder()
  .setName('rsvp')
  .setDescription('RSVP to an event')
  .addStringOption(option =>
    option
      .setName('event')
      .setDescription('Select the event')
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addStringOption(option =>
    option
      .setName('status')
      .setDescription('Your attendance status')
      .setRequired(true)
      .addChoices(
        { name: '✅ Yes - I\'m attending', value: 'yes' },
        { name: '❌ No - I can\'t make it', value: 'no' },
        { name: '❓ Maybe - Not sure yet', value: 'maybe' }
      )
  );
