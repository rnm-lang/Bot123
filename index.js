require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const oauthRoutes = require('./routes/oauth');


// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Collection for commands
client.commands = new Collection();

// Load commands dynamically from subfolders
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Load events dynamically
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  const eventName = file.split('.')[0];

  if (eventName === 'interactionCreate') {
    client.on('interactionCreate', async interaction => {
      try {
        await event(client, interaction);
      } catch (error) {
        console.error(`Error in event handler ${eventName}:`, error);
      }
    });
  } else {
    // Example: handle 'ready' or other events by name
    client.on(eventName, (...args) => event(client, ...args));
  }
}

app.use('/', oauthRoutes);

app.listen(3000, () => {
  console.log('Web server running on http://localhost:3000');
});


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Log in to Discord
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('✅ Logged into Discord'))
  .catch(err => console.error('❌ Discord login error:', err));

// Optional debug logs for env variables (remove or comment out in production)
console.log('Discord Token:', process.env.DISCORD_TOKEN ? 'Loaded' : 'Missing');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Loaded' : 'Missing');