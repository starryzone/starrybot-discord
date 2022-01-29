'use strict';

const db = require("./db")
const logger = require("./logger")
const { globalUserWizards } = require("./wizard/wizard.js")

const { Client, Intents } = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { myConfig } = require("./db");
const { createMissingAccessMessage, createWelcomeMessage } = require("./utils/messages");
const { checkIfCommandsEnabled, checkIfInteractionIsStarry, getCommandHandler, starryGuildCommands } = require("./utils/commands");

const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS ]);
const client = new Client({intents: intents })
const TIMEOUT_DURATION = 360000; // 6 minutes in milliseconds

// @todo find mainnet RPC endpoint we can use
// const MAINNET_RPC_ENDPOINT = process.env.MAINNET_RPC_ENDPOINT || 'https://…halp…'

///////////////////////////////////////////////////////////////////////////////////////////////////

///
/// Default roles (later we may not have any default roles)
///

let desiredRoles = [
	{
		name:'osmo-hodler',
		type:"native",
		address:"osmo",
		net:"mainnet",
	},
	{
		name:'juno-hodler',
		type:"native",
		address:"juno",
		net:"mainnet",
	}
];
// Display name for the roles in the welcome embed
let desiredRolesForMessage = desiredRoles.map(role=>{role.name}).join('\n- ');

//////////////////////////////////////////////////////////////////////////////////////////////////

///
/// When StarryBot joins a new guild, let's create any default roles and say hello
///

async function guildCreate(guild) {
	const systemChannelId = guild.systemChannelId;
	let systemChannel = await client.channels.fetch(systemChannelId);
	const welcomeMessage = createWelcomeMessage(client.user, desiredRolesForMessage);
	await systemChannel.send(welcomeMessage);
	let existingRoles =	await guild.roles.fetch();
	for(let i = 0;i<desiredRoles.length;i++) {
		let role = desiredRoles[i]
		// See if we can find an existing role with the same name.
		if(!existingRoles.find(existingRole => existingRole.name === role.name)) {
			await guild.roles.create({name: role.name, position: 0})
		}
		await db.rolesSet(guild.id,role.name,role.type,role.address,role.net,true,client.user.id,1);
	}
}

///
/// They say they've allowed the bot to add Slash Commands,
/// Let's try to add ours for this guild and catch it they've lied to us.
///
async function registerGuildCommands(interaction) {

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
/// A user may have sent an emoji - we are very interested in these
///

async function messageReactionAdd(reaction,user) {
	if (user.bot) return; // don't care about bot's emoji reactions
	await checkReactionWithWizard(reaction)
	// When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	// The reaction is now also fully available and the properties will be reflected accurately:
	console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
}

////////////////////////////////////////////////////////////////////////////////////////////////

///
/// A user has a command for us - resolve
///
async function handleGuildCommands(interaction) {
	// only observe "/starry *" commands
	if (!checkIfInteractionIsStarry(interaction)) {
		return
	}
	let group = interaction.options['_group'] || ""
	let subcommand = interaction.options['_subcommand']
	let path = `${group} ${subcommand}`.trim()
	let handler = getCommandHandler(path);
	if(!handler) {
		await interaction.channel.send("Cannot find the command you asked for")
		return
	} else {
		await handler(interaction, client, globalUserWizards)
	}
}

client.on('messageCreate', async interaction => {
	if (interaction.author.bot) return;
	await checkInteractionWithWizard(interaction)
});

///
/// A glorious user interaction has arrived - bask in its glow
///

async function interactionCreate(interaction) {
	if (interaction.isButton()) {
		if (interaction.customId === 'slash-commands-enabled') {
			return registerGuildCommands(interaction)
		}
	} else if (interaction.isCommand()) {
		return handleGuildCommands(interaction)
	} else {
		await checkInteractionWithWizard(interaction)
		console.error('Interaction is NOT understood!')
		console.error(interaction)
	}
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////

///
/// Handle inbound events from discord
///

client.on("ready", async () => { logger.info(`StarryBot has star(ry)ted.`) });
client.on("guildCreate", guildCreate );
client.on('interactionCreate', interactionCreate );
client.on('messageReactionAdd', messageReactionAdd );

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
	} else {
		logger.log('Issue connecting to Discord')
	}
})

// Respond to general interaction
async function checkInteractionWithWizard(interaction) {
	if (globalUserWizards.size === 0) return;
	const authorId = interaction.author.id;
	const wizardKey = `${interaction.guildId}-${authorId}`;
	// If it's a regular "DEFAULT" message from a user in the wizard on that step
	if (interaction.type === 'DEFAULT' && globalUserWizards.has(wizardKey)) {
		// Check if its expired and delete it if so
		const userWizard = globalUserWizards.get(wizardKey)
		if (Date.now() - userWizard.createdAt > TIMEOUT_DURATION) {
			globalUserWizards.delete(wizardKey)
			console.log("Deleted a user's wizard as it took them too long to respond.")
			return;
		}
		await userWizard.currentStep.resultFn({interaction})
	}
}

// Respond to emoji reaction
async function checkReactionWithWizard(reaction) {
	if (globalUserWizards.size === 0) return;

	// See if the "reactor" has a wizard going
	// Note: checking for interaction key as some emoji reactions didn't seem to have this
	// Also, this check exists because an emoji to a reply-message will have a null interaction value for some reason
	if (!reaction.message.hasOwnProperty('interaction') || reaction.message.interaction === null) return;
	const reactorUserId = reaction.message.interaction.user.id;

	const globalUserWizardKey = `${reaction.message.guildId}-${reactorUserId}`;
	if (!globalUserWizards.has(globalUserWizardKey)) return;

	const emojiName = reaction._emoji.name;
	let userCurrentStep = globalUserWizards.get(globalUserWizardKey).currentStep;
	userCurrentStep.resultFn({
		guildId: reaction.message.guildId,
		channelId: reaction.message.channelId
	}, emojiName)
}

module.exports = { client }
