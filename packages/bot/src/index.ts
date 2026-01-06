import { Client, GatewayIntentBits, REST, Routes, Events } from 'discord.js';
import { createEventCommand } from '@/commands/createEvent';
import { createPollCommand } from '@/commands/createPoll';
import { editEventModulesCommand } from '@/commands/editEventModules';
import { rsvpCommand } from '@/commands/rsvp';
import { manageMembersCommand } from '@/commands/manageMembers';
import { handleInteraction } from '@/handlers/interactionHandler';
import { handleAutocomplete } from '@/handlers/autocompleteHandler';
import { handleMention } from '@/handlers/mentionHandler';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // Required to fetch guild members
  ],
});

// Bot ready event - register slash commands
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Bot is online! Logged in as ${readyClient.user.tag}`);

  // Create REST client for command registration
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

  try {
    console.log('Registering slash commands...');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      {
        body: [
          createEventCommand.toJSON(),
          createPollCommand.toJSON(),
          editEventModulesCommand.toJSON(),
          rsvpCommand.toJSON(),
          manageMembersCommand.toJSON()
        ]
      }
    );

    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
});

// Handle @mentions and edit sessions
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if user is in edit mode (even without mentioning bot)
  global.editSessions = global.editSessions || new Map();
  const editSession = global.editSessions.get(message.author.id);

  if (editSession) {
    // User is editing - handle their message even without mention
    await handleMention(message);
    return;
  }

  // Check if bot was mentioned
  if (message.mentions.has(client.user!.id)) {
    await handleMention(message);
  }
});

// Handle interactions (slash commands, buttons, autocomplete)
client.on(Events.InteractionCreate, async (interaction) => {
  // Handle autocomplete
  if (interaction.isAutocomplete()) {
    await handleAutocomplete(interaction);
    return;
  }

  // Handle other interactions (slash commands, buttons)
  await handleInteraction(interaction);
});

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN!);





