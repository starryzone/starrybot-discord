'use strict';

const db = require("./db")
const logger = require("./logger")
const logic = require("./logic")
const { globalUserWizards } = require("./wizard/wizard.js")

const { Client, Intents, MessageEmbed, MessagePayload, MessageButton, MessageActionRow } = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { myConfig } = require("./db");
const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS ]);
const client = new Client({intents: intents })
const TIMEOUT_DURATION = 360000; // 6 minutes in milliseconds

let validatorURL = db.myConfig.VALIDATOR

const { WizardAddTokenRule } = require("./wizard/add-token-rule");
// @todo find mainnet RPC endpoint we can use
// const MAINNET_RPC_ENDPOINT = process.env.MAINNET_RPC_ENDPOINT || 'https://…halp…'

///
/// a helper to build display ux
///

function createEmbed(traveller, saganism) {
	let url = `${validatorURL}?traveller=${traveller}`
	return new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Please visit ${url}`)
		.setURL(url)
		.setAuthor('StarryBot', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
		.setDescription(saganism)
		.setThumbnail('https://i.imgur.com/AfFp7pu.png')
		.setTimestamp()
		.setFooter('Put your helmet on', 'https://i.imgur.com/AfFp7pu.png');
}

///
/// When StarryBot joins a new guild, let's create a default role and say hello
///

async function guildCreate(guild) {
	const systemChannelId = guild.systemChannelId;
	let desiredRoles = ['osmo-hodler', 'juno-hodler'];
	const desiredRolesForMessage = desiredRoles.join('\n- ');
	let systemChannel = await client.channels.fetch(systemChannelId);
	const embed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Enable secure slash commands`)
		.setDescription(`StarryBot just joined, and FYI there are two roles:\n- ${desiredRolesForMessage}`)
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

	const existingObjectRoles = await guild.roles.fetch();

	let existingRoles = {}
	for (let role of existingObjectRoles.values()) {
		existingRoles[role.name] = role.id
	}

	// See if there are existing roles and only create ones we don't have
	let finalRoleMapping = {}
	for (let role of desiredRoles) {
		// Create role unless it already existed above
		if (existingRoles.hasOwnProperty(role)) {
			finalRoleMapping[role] = existingRoles[role]
		} else {
			const newRole = await guild.roles.create({name: role, position: 0})
			console.log('newRole', newRole)
			finalRoleMapping[role] = newRole.id
		}
	}

	// Add default roles
	await db.rolesSet(guild.id, desiredRoles[0], 'native', 'osmo', 'mainnet', true, client.user.id, 1)
	await db.rolesSet(guild.id, desiredRoles[1], 'native', 'juno', 'mainnet', true, client.user.id, 1)
}

///
/// They say they've allowed the bot to add Slash Commands,
/// Let's try to add ours for this guild and catch it they've lied to us.
///
async function registerGuildCommands(interaction) {

	const rest = new REST().setToken(myConfig.DISCORD_TOKEN);
	try {
		// Note: discordjs doesn't have abstractions for subcommand groups and subcommands like I expected. Used logic from:
		// https://discord.com/developers/docs/interactions/application-commands#example-walkthrough
		let postResult = await rest.post(
			Routes.applicationGuildCommands(interaction.applicationId, interaction.guildId),
			{ body: {
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
						}
					]
				}
			 },
		);
		console.log('postResult', postResult)
	} catch (e) {
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
			console.log('post error', e)
			interaction.reply('Something does not seem right, please try adding StarryBot again.')
		}
		return;
	}

	// Slash command are added successfully, double-check then tell the channel it's ready
	let enabledGuildCommands = await rest.get(
		Routes.applicationGuildCommands(interaction.applicationId, interaction.guildId)
	);
	console.log('enabledGuildCommands', enabledGuildCommands)

	// Ensure (double-check) we have the Slash Command registered,
	//   then publicly tell everyone they can use it
	for (let enabledGuildCommand of enabledGuildCommands) {
		if (enabledGuildCommand.name === 'starry') {
			return await interaction.reply('Feel free to use the /starry join command, friends.')
		}
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

///
/// A user has a command for us - resolve
///
async function handleGuildCommands(interaction) {
	console.log('Interaction is a command')
	const userId = interaction.user.id

	// for all "/starry *" commands
	if (interaction.commandName === 'starry') {
		if (interaction.options['_group'] === null) {
			// Immediate subcommands, so "/starry foo"
			if (interaction.options['_subcommand'] === 'join') {
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
		} else {
			// This has a subcommand group, so "/starry my-group foo"
			if (interaction.options['_group'] === 'token-rule') {
				// User wants to modify a token and rule to add which Discord role
				switch (interaction.options['_subcommand']) {
					case 'add':
						// TODO: this is where we'll want to do a filter/map deal to remove all entries that have a {wizard}.createdAt that's > some amount, like 6 minutes

						let addTokenRuleWizard = new WizardAddTokenRule(interaction.guildId, interaction.channelId, userId, client)
						// Begin the wizard by calling the begin function on the first step
						const msg = await addTokenRuleWizard.currentStep.beginFn({interaction});

						// Now that we have the message object, we can set that, (sometimes) helping determine the user is reacting to the proper message
						addTokenRuleWizard.currentStep.setMessageId(msg.id)

						// Set the in-memory Map
						globalUserWizards.set(`${interaction.guildId}-${userId}`, addTokenRuleWizard)
						break;
					case 'edit':
						break;
					case 'remove':
						break;
				}
			}
		}
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
