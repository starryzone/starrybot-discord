const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const db = require("../db");
const { myConfig } = db;
const { starryCommand } = require("../commands");
const { createEmbed } = require("../utils/messages");
///
/// Default roles (later we may not have any default roles)
///

const desiredRoles = [
	// {
	// 	name:'osmo-hodler',
	// 	type:"native",
	// 	address:"osmo",
	// 	net:"mainnet",
	// },
	{
		name:'juno-hodler',
		type:"native",
		address:"juno",
		net:"mainnet",
	}
];

// Display name for the roles in the welcome embed
const desiredRolesForMessage = desiredRoles.map(role => role.name).join('\n- ');

async function initializeDefaultRoles(guild) {
	let existingRoles =	await guild.roles.fetch();
	const { client } = guild;
	for (let i = 0; i < desiredRoles.length; i++) {
		let role = desiredRoles[i]
		// See if we can find an existing role with the same name.
		if(!existingRoles.find(existingRole => existingRole.name === role.name)) {
			await guild.roles.create({name: role.name, position: 0})
		}
		await db.rolesSet(guild.id,role.name,role.type,role.address,role.net,true,client.user.id,1);
	}
}
///
/// If the bot was added to the server with the correct scope, it should
/// have the authorization to add commands already.
/// Let's try it and warn if this isn't the case.
///
async function registerGuildCommands(appId, guildId) {
	const rest = new REST().setToken(myConfig.DISCORD_TOKEN);

	// Add guild commands via abstractions extrapolated from following sources:
	// https://discordjs.guide/creating-your-bot/command-handling.html
	// https://discord.com/developers/docs/interactions/application-commands#example-walkthrough
	let putResult = await rest.put(
		Routes.applicationGuildCommands(appId, guildId),
		{ body: [starryCommand.data.toJSON()] }
	);
	console.log('putResult', putResult)

	// Slash command are added successfully, double-check then tell the channel it's ready
	try {
		let enabledGuildCommands = await rest.get( Routes.applicationGuildCommands(appId, guildId) );
		console.log('enabledGuildCommands', enabledGuildCommands)
	} catch (e) {
		throw 'commands not enabled';
	}
}

///
/// When starrybot joins a new guild, let's create any default roles and say hello
///

async function guildCreate(guild) {
	const systemChannelId = guild.systemChannelId;
	const { client } = guild;
	let systemChannel = await client.channels.fetch(systemChannelId);
	try {
		await registerGuildCommands(client.application.id, guild.id);
		systemChannel.send({
			embeds: [
				createEmbed({
					title: 'Hello friends!',
					description: `starrybot just joined, and FYI there are some roles:\n- ${desiredRolesForMessage}`,
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

	try {
		await initializeDefaultRoles(guild);
	} catch (e) {
		if (e) {
			console.warn(e);
			systemChannel.send('Default roles could not be added :(\n Please try kicking and reinstalling starrybot again: https://starrybot.xyz/');
		}
	}
}

module.exports = {
    guildCreate,
}
