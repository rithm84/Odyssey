// importing Client and Intents objects from discord.js
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { pingCommand } from './commands/ping.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import dotenv from 'dotenv';

// loading plain text env vars into process.env
dotenv.config();
// create a new client object and pass it parameters of intents (events) we want to listen to
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// using 'once' so that as soon as bot logs in, we get a message letting us know it's online and listening for events
// ! is the null assertion operator (lets TS know that client.user is not null for sure because we know the ready event is sent back)
client.once('clientReady', async() => {
  console.log(`✅ Bot is online! Logged in as ${client.user!.tag}`);
  
  // create a rest client and set its token for authentication
  const rest = new REST({ version: '10'}).setToken(process.env.DISCORD_BOT_TOKEN!);

  // use a try-catch and await to send an HTTP PUT request to the Discord API and register commands
  try {
    console.log('Registering slash commands...');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: [pingCommand.toJSON()]}
    )
    console.log('Slash commands registered!')
  } catch (error) {
    console.error('Error registering commands: ', error)
  }
});

// interactionCreate event handler checks for any interaction, screens for slash commands, then has actions for each command
client.on('interactionCreate', handleInteraction);

// log in after registering the event handlers and start listening for events
client.login(process.env.DISCORD_BOT_TOKEN);





