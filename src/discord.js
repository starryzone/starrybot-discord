'use strict';

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Collection, Intents } = require('discord.js')

const db = require("./db")
const logger = require("./logger")
const {
    guildCreate,
    interactionCreate,
    messageCreate,
    messageReactionAdd,
} = require("./handlers")
const { starryCommand } = require('./commands');

const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS ]);
const client = new Client({intents: intents })

/// Install commands
client.commands = new Collection();
/// Install /starry command, which includes the actual commands for this bot
// as subcommands and subcommand groups, as configured in src/commands/index.js
// starryCommand.data.name is "starry"
// starryCommand has the execute function
client.commands.set(starryCommand.data.name, starryCommand);

///
/// Handle inbound events from discord
///

// Handler for discord bot server starting
client.on("ready", async (client) => {
  logger.info(`starrybot has star(ry)ted.`);

  // Now that the bot has restarted, see if any guilds using us
  // needs to pick up an updated version of the application commands

  let updatedGuilds = 0;
  let skippedGuilds = 0;
  let erroredGuilds = 0;

  // Get the latest description of our starry commands for comparison.
  // Discord deletes the "option" property if it's just an
  // empty array, but our toJSON always has them set. We do
  // a naive JSON.stringify comparison below, so delete them here
  const updatedStarry = starryCommand.data.toJSON();
  updatedStarry.options.forEach((opt) => {
    if (opt.options) {
      if (opt.options.length === 0) {
        delete opt.options;
      } else {
        opt.options.forEach((subOpt) => {
          // We don't have more than 2 layers today, but just in case..
          if (subOpt.options && subOpt.options.length === 0) {
            delete subOpt.options;
          }
        });
      }
    }
  });

  const rest = new REST().setToken(db.myConfig.DISCORD_TOKEN);
  // Loop through all guilds that are registered with us
  client.guilds.cache.forEach(async (guild) => {
    try {
      // Get the application commands currently registered with this guild
      const currentCommands = await rest.get(
        Routes.applicationGuildCommands(client.application.id, guild.id)
      );
      const currentStarry = currentCommands.find(
        (command) => command.name === updatedStarry.name
      );

      // Determine if this guild needs updating
      const needsUpdate =
        // ??? where is our command?
        !currentStarry ||
        // We updated the description
        currentStarry.description !== updatedStarry.description ||
        // We have a different number of options
        currentStarry.options.length !== updatedStarry.options.length ||
        // At least one of the options is now different
        updatedStarry.options.some((updatedOpt) => {
          const currentOpt = currentStarry.options.find(
            (curOpt) => curOpt.name === updatedOpt.name
          );
          return JSON.stringify(updatedOpt) !== JSON.stringify(currentOpt);
        });

      if (needsUpdate) {
        // The commands need updating, do it for them <3
        await rest.put(
          Routes.applicationGuildCommands(client.application.id, guild.id),
          { body: [starryCommand.data.toJSON()] }
        );
        updatedGuilds += 1;
      } else {
        skippedGuilds += 1;
      }
    } catch (e) {
      console.warn(e);
      erroredGuilds += 1;
    }

    // Not sure how valuable this is, but could be interesting
    if (updatedGuilds > 0) console.log(`Updated commands for ${updatedGuilds} guild(s)`)
    if (skippedGuilds > 0) console.log(`Skipped update for ${skippedGuilds} guild(s)`)
    if (erroredGuilds > 0) console.log(`Failed to update ${erroredGuilds} guild(s)`);
  });
});

// Handler for discord bot joining a server
client.on("guildCreate", guildCreate);

// Handler for discord bot messages being directly interacted with
// (e.g. button press, commands used, replies in the command chain)
client.on('interactionCreate', interactionCreate);

// Handler for messages that may be responses to the command chain
client.on('messageCreate', messageCreate);

// Handler for emoji reactions on discord messages from our bot
client.on('messageReactionAdd', messageReactionAdd );

//////////////////////////////////////////////////////////////////////////////////////////////////////////

///
/// Register with discord
///

const login = async () => {
	let token = db.myConfig.DISCORD_TOKEN || process.env.DISCORD_TOKEN;
	const loggedInToken = await client.login(token)
	if (loggedInToken !== token) {
		logger.warn('There might be an issue with the Discord login')
		return false
	} else {
		return true
	}
}

login().then((res) => {
	if (res) {
		logger.log('Connected to Discord')
		client.user.setActivity('ya. starrybot.xyz', { type: 'LISTENING' })
	} else {
		logger.log('Issue connecting to Discord')
	}
})

module.exports = { client }
