const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const { myConfig } = require("../db");
const { checkIfCommandsEnabled, checkIfInteractionIsStarry, getCommandHandler, starryGuildCommands } = require("../utils/commands");
const { createMissingAccessMessage } = require("../utils/messages");
const { checkInteractionWithWizard } = require("../wizard/wizard");

///
/// They say they've allowed the bot to add Slash Commands,
/// Let's try to add ours for this guild and catch it they've lied to us.
///
async function registerGuildCommands(interaction, client) {

	let appId = interaction.applicationId
	let guildId = interaction.guildId
	const rest = new REST().setToken(myConfig.DISCORD_TOKEN);

	// add guild commands
	try {
		// Note: discordjs doesn't have abstractions for subcommand groups and subcommands like I expected. Used logic from:
		// https://discord.com/developers/docs/interactions/application-commands#example-walkthrough
		let postResult = await rest.post( Routes.applicationGuildCommands(appId,guildId), { body: starryGuildCommands } );
		console.log('postResult', postResult)
	} catch (e) {
		console.error(e)
		if (e.code === 50001 || e.message === 'Missing Access') {
			// We have a prevaricator
			const msgPayload = createMissingAccessMessage(client.user);
			interaction.reply(msgPayload)
		} else {
			console.log('post error', e)
			interaction.reply('Something does not seem right, please try adding StarryBot again.')
		}
		return;
	}

	// Slash command are added successfully, double-check then tell the channel it's ready
	let enabledGuildCommands = await rest.get( Routes.applicationGuildCommands(appId,guildId) );
	console.log('enabledGuildCommands', enabledGuildCommands)
	if (checkIfCommandsEnabled(enabledGuildCommands)) {
		return await interaction.reply('Feel free to use the /starry join command, friends.');
	}
}


///
/// A user has a command for us - resolve
///
async function handleGuildCommands(interaction, client) {
	// only observe "/starry *" commands
	if (!checkIfInteractionIsStarry(interaction)) {
		return
	}
    let group = interaction.options['_group'] || "";
    let subcommand = interaction.options['_subcommand'];
	let path =  `${group} ${subcommand}`.trim();
	let handler = getCommandHandler(path);
	if(!handler) {
		await interaction.channel.send("Cannot find the command you asked for")
		return
	} else {
		await handler(interaction, client)
	}
}


///
/// A glorious user interaction has arrived - bask in its glow
///

async function interactionCreate(interaction, client) {
	if (interaction.isButton()) {
		if (interaction.customId === 'slash-commands-enabled') {
			return registerGuildCommands(interaction, client)
		}
	} else if (interaction.isCommand()) {
		return handleGuildCommands(interaction, client)
	} else {
		await checkInteractionWithWizard(interaction)
		console.error('Interaction is NOT understood!')
		console.error(interaction)
	}
}

module.exports = {
    interactionCreate,
}
