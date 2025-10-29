// importing Client and Intents objects from discord.js
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

// loading plain text env vars into process.env
dotenv.config();

const pingCommand = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');

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
client.once('clientReady', () => {
  console.log(`✅ Bot is online! Logged in as ${client.user!.tag}`);
});

// using 'on' to listen to messages as they are sent multiple times
client.on('messageCreate', (message) => {
  if (message.author.bot) return; // ignore messages from the bot itself
  if (message.content === '!ping') {
    message.reply('Pong! 🏓');
  }
});

// log in after registering the event handlers and start listening for events
client.login(process.env.DISCORD_BOT_TOKEN);





