const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const db = require("../db");
const { myConfig } = db;
const { starryCommand } = require("../commands");
const { createEmbed } = require("../utils/messages");

// If the bot was added to the server with the correct scope, it should
// have the authorization to add commands already.
// Let's try it and warn if this isn't the case.
async function registerGuildCommands(appId, guildId) {
  const rest = new REST().setToken(myConfig.DISCORD_TOKEN);

  // Add guild commands via abstractions extrapolated from following sources:
  // https://discordjs.guide/creating-your-bot/command-handling.html
  // https://discord.com/developers/docs/interactions/application-commands#example-walkthrough
  // TODO try catch
  await rest.put(
    Routes.applicationGuildCommands(appId, guildId),
    { body: [starryCommand.data.toJSON()] }
  );

  // Slash command are added successfully, double-check then tell the channel it's ready
  try {
    await rest.get( Routes.applicationGuildCommands(appId, guildId) );
  } catch (e) {
    throw 'commands not enabled';
  }
}

// When starrybot joins a new guild, let's say hello and let them know they can use /starry now
async function guildCreate(guild) {
  let systemChannelId = guild.systemChannelId;
  const { client } = guild;
  if (systemChannelId === null) {
    // Create a "starrybot" channel or get it
    let existingStarryBotChannel = guild.channels.cache.find(c => c.name === 'starrybot');
    if (existingStarryBotChannel) {
      systemChannelId = existingStarryBotChannel.id
    } else {
      // Did not find an existing channel, create one
      const creationRes = await guild.channels.create('starrybot')
      systemChannelId = creationRes.id
    }
  }

  let systemChannel = await client.channels.fetch(systemChannelId);
  try {
    await registerGuildCommands(client.application.id, guild.id);
    systemChannel.send({
      embeds: [
        createEmbed({
          title: 'Hello friends!',
          description: 'starrybot just joined',
          footer: 'Feel free to use the /starry join command.'
        })
      ]
    })
  } catch (e) {
    if (e) {
      console.warn(e);
      systemChannel.send('Commands could not be added :(\n Please try kicking and reinstalling starrybot again: https://starrybot.xyz/');
    }
  }
}

module.exports = {
    guildCreate,
}
