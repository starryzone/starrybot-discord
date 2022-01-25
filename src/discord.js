'use strict';

const db = require("./db")
const logger = require("./logger")
const logic = require("./logic")
const Sagan = require("./sagan.js")
const { Wizard, WizardStep } = require("./wizard/wizard.js")

const { Client, Intents, MessageEmbed, Permissions, MessagePayload, MessageButton, MessageActionRow, RoleManager} = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { myConfig } = require("./db");
const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS ]);
const client = new Client({intents: intents })

let validatorURL = db.myConfig.VALIDATOR

const { CosmWasmClient } = require('@cosmjs/cosmwasm-stargate')
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_CHAIN_RPC_ENDPOINT || 'https://rpc.uni.juno.deuslabs.fi/'

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

///
/// This is correctly shaped blob for registering our commands with discord via rest
///
/// Note: discordjs doesn't have abstractions for subcommand groups and subcommands like I expected. Used logic from:
/// https://discord.com/developers/docs/interactions/application-commands#example-walkthrough
///

const starryCommands = {
	"name": "starry",
	"description": "Use StarryBot (starrybot.xyz)",
	"options": [
		{
			"name": "token-rule",
			"description": "cw20 or cw721 token and Discord role",
			"type": 2, // SUB_COMMAND_GROUP
			"options": [
				{
					"name": "add",
					"description": "Add a new token rule",
					"type": 1 // SUB_COMMAND
				},
				{
					"name": "edit",
					"description": "Edit token rule",
					"type": 1
				},
				{
					"name": "remove",
					"description": "Remove token rule",
					"type": 1
				}
			]
		},
		{
			"name": "join",
			"description": "Get link to verify your account with Keplr",
			"type": 1,
		},
		{
			"name": "farewell",
			"description": "Kick starrybot itself from your guild",
			"type": 1,
		}
	]
}

///
/// Command lookup
/// The command handlers for the above commands
/// (Kept separate from above for now because the blob above is already formatted for discords consumption)
///

const starryCommandHandlers = {
	"join": starryCommandJoin(),
	"farewell": starryCommandJoin(),
	"add": starryCommandTokenAdd(),
	"edit": starryCommandTokenEdit(),
	"remove": starryCommandTokenRemove()
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

///
/// a helper to build display ux
///

function createEmbed(traveller, saganism) {
	let url = `${validatorURL}?traveller=${traveller}`
	return new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Please visit ${url}`)
		.setURL(url)
		.setAuthor('Starrybot', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
		.setDescription(saganism)
		.setThumbnail('https://i.imgur.com/AfFp7pu.png')
		.setTimestamp()
		.setFooter('Put your helmet on', 'https://i.imgur.com/AfFp7pu.png');
}

///
/// A helper to print a nice message
///

async function printNiceMessageInDiscord(guild,message) {

	const systemChannelId = guild.systemChannelId;
	let systemChannel = await client.channels.fetch(systemChannelId);

	const embed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Enable secure slash commands`)
		.setDescription(`StarryBot just joined${message}`)
		.setImage('https://starrybot.xyz/starrybot-slash-commands2.gif')

	const row = new MessageActionRow()
		.addComponents(
			new MessageButton()
				.setCustomId('slash-commands-enabled')
				.setLabel("I just did it")
				.setStyle('PRIMARY'),
		);

	const msgPayload = MessagePayload.create(client.user, {
		content: 'Hello friends, one more step please.\nSee the GIF below…',
		embeds: [embed],
		components: [row]
	});
	await systemChannel.send(msgPayload);	
}

///
/// A helper to create a role if needed
///

async function createGuildRoleInDiscord(guild,role) {

	// look in cache
	let existing = guild.roles.cache.find(r => r.name === role.name) 

	// try harder - unfortunately there's no real way around this since admins can create roles at their whim
	if(!existing) {
		await guild.roles.fetch();
		existing = guild.roles.cache.find(r => r.name === role.name) 
	}

	// since the role exists simply return null to indicate that we did no work
	if(existing) {
		return false
	}

	// make role
	await guild.roles.create({name: role.name, position: 0})
	return true
}


//////////////////////////////////////////////////////////////////////////////////////////////////

///
/// When StarryBot joins a new guild, let's create any default roles and say hello
///

async function guildCreate(guild) {

	let added = []

	for(let i = 0; i < desiredRoles.length; i++) {

		let r = desiredRoles[i]

		// 
		added.push(r.name)

		// make role in discord if needed else skip to next
		let updated = await createGuildRoleInDiscord(guild,r)

		// also remember new role in our db
		if(updated) {
			await db.rolesSet(guild.id,0,r.name,r.type,r.address,r.net,true);
		}
	}

	// print a nice message to the user
	let message = ""
	if(added.length) {
		message = "\nFYI there are some roles:\n- " + added.join('\n- ');
	}
	await printNiceMessageInDiscord(guild,message);
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
		await rest.post( Routes.applicationGuildCommands(appId,guildId), { body: starryCommands } );
	} catch (e) {
		console.error(e)
		if (e.code === 50001 || e.message === 'Missing Access') {
			// We have a prevaricator
			const row = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('slash-commands-enabled')
						.setLabel("I really did it this time")
						.setStyle('PRIMARY'),
				);

			const msgPayload = MessagePayload.create(client.user, {
				content: "That's funny because Discord just told me you didn't. :/\nCan we try that again? (Scroll up to see the animated GIF for instructions)",
				components: [row]
			});
			interaction.reply(msgPayload)
		} else {
			interaction.reply('Something does not seem right, please try adding StarryBot again.')
		}
		return;
	}

	// Slash command are added successfully, double-check then tell the channel it's ready
	let enabledGuildCommands = await rest.get( Routes.applicationGuildCommands(appId,guildId) );
	console.log('enabledGuildCommands', enabledGuildCommands)

	// Ensure (double-check) we have the Slash Command registered,
	//   then publicly tell everyone they can use it
	for (let enabledGuildCommand of enabledGuildCommands) {
		if (enabledGuildCommand.name === starryCommands.name) {
			return await interaction.reply('Feel free to use the /starry join command, friends.')
			break;
		}
	}
}

///
/// A user may have sent an emoji - we are very interested in these
///

async function messageReactionAdd(reaction,user) {
	if (user.bot) return; // don't care about bot's emoji reactions
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

	// Now the message has been cached and is fully available
	console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
	// The reaction is now also fully available and the properties will be reflected accurately:
	console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
}

// This is where we'll keep user's progress through the wizard "in memory"
let globalUserWizards = []

////////////////////////////////////////////////////////////////////////////////////////////////

function starryCommandJoin(interaction) {
	try {
		let results = await logic.hoistRequest({guildId: interaction.guildId, authorId: interaction.member.user.id})
		if (results.error || !results.traveller || !results.saganism) {
			interaction.channel.send(results.error || "Internal error")
		} else {
			// We reply "privately" instead of sending a DM here
			return await interaction.reply({embeds:[createEmbed(results.traveller,results.saganism)], ephemeral: true})
		}
	} catch(err) {
		logger.error(err)
		await interaction.channel.send("Internal error adding you")
	}
}

function starryCommandFarewell(interaction) {

	let appId = interaction.applicationId
	let guildId = interaction.guildId
	const rest = new REST().setToken(myConfig.DISCORD_TOKEN);

	// delete global commands prior to re-adding
	let commands = await rest.get( Routes.applicationCommands(appId) );
	for (let command of commands) {
		console.log("deleting global : ",command);
		let results = await rest.delete(`${Routes.applicationCommands(appId)}/${command.id}`);
	}

	// delete local commands prior to re-adding
	commands = await rest.get( Routes.applicationGuildCommands(appId,guildId) );
	for (let command of commands) {
		console.log("deleting local : ",command);
		let results = await rest.delete(`${Routes.applicationGuildCommands(appId,guildId)}/${command.id}`);
	}

	// delete all the roles
	db.rolesDeleteGuildAll()

	// leave
	guildId.leave()
}

function starryCommandTokenAdd(interaction) {
	const msg = await interaction.reply(
		{ embeds: [
				new MessageEmbed()
					.setColor('#FDC2A0')
					.setTitle('Tell us about your token')
					.setDescription('🌠 Choose a token\n✨ I need to make a token')
			],
			fetchReply: true
		}
	)
	try {
		await msg.react('🌠');
		await msg.react('✨');
	} catch (error) {
		console.error('One of the emojis failed to react:', error);
	}
	// TODO: this is where we'll want to do a filter/map deal to remove all entries that have a {wizard}.createdAt that's > some amount, like 6 minutes
	globalUserWizards.push(msg)
}

function starryCommandTokenEdit(interaction) {
}

function starryCommandTokenRemove(interaction) {
}

/////////////////////////////////////////////////////////////////////////////////////////////////

///
/// A glorious user interaction has arrived - bask in its glow
///

async function interactionCreate(interaction) {
	if (interaction.isButton()) {
		if (interaction.customId === 'slash-commands-enabled') {
			return registerGuildCommands(interaction)
		}
	} else if (interaction.isCommand()) {
		// only observe "/starry *" commands
		if (interaction.commandName !== starryCommands.name) {
			return
		}
		// let group = interaction.options['_group'] <- completely ignore this prefix by having non collidant subcommands
		let subcommand = interaction.options['_subcommand']
		let handler = starryCommandHandlers[subcommand]
		if(!handler) {
			await interaction.channel.send("Cannot find the command you asked for")
			return
		} else {
			handler(interaction)
		}
	} else {
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

module.exports = { client }
