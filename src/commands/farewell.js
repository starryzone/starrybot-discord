const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const db = require("../db")
const { myConfig } = require("../db");

///
/// Farewell
///

async function starryCommandFarewell(interaction) {

	let appId = interaction.applicationId
	let guildId = interaction.guildId
	const rest = new REST().setToken(myConfig.DISCORD_TOKEN);

	// delete local commands
	let commands = await rest.get( Routes.applicationGuildCommands(appId,guildId) );
	for (let command of commands) {
		console.log("deleting local : ",command);
		let results = await rest.delete(`${Routes.applicationGuildCommands(appId,guildId)}/${command.id}`);
	}

	// delete all the roles
	await db.rolesDeleteGuildAll(guildId)

	// confirm
	await interaction.reply('Bye!')

	// leave
	let results = await interaction.guild.leave()
}

module.exports = {
    starryCommandFarewell,
}
