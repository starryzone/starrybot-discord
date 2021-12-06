
'use strict';

const db = require("./db")
const logger = require("./logger")
const logic = require("./logic")
const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed, Permissions, MessagePayload, MessageButton, MessageActionRow } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);
const client = new Client({intents: intents })

let validatorURL = db.myConfig.VALIDATOR

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

client.on("ready", async () => {
	logger.info(`StarryBot has star(ry)ted.`)
});

client.on("guildIntegrationsUpdate", async guild => {
	console.log('guildIntegrationsUpdate\n guild', guild)
});
client.on("applicationCommandCreate", async command => {
	console.log('applicationCommandCreate\n command', command)
});
client.on("applicationCommandUpdate", async command => {
	console.log('applicationCommandUpdate\n command', command)
});
client.on("guildUpdate", async guild => {
	console.log('guildUpdate\n guild', guild)
});
client.on("webhookUpdate", async guild => {
	console.log('webhookUpdate\n guild', guild)
});

// When StarryBot joins a new guild, let's create a default role and say hello
client.on("guildCreate", async guild => {
	const systemChannelId = guild.systemChannelId;
	let desiredRoles = ['osmo-hodler', 'juno-hodler'];
	const desiredRolesForMessage = desiredRoles.join('\n- ');
	let systemChannel = await client.channels.fetch(systemChannelId);
	const embed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Enable secure slash commands`)
		.setDescription(`StarryBot just joined, and FYI there are two roles:\n- ${desiredRolesForMessage}`)
		.setImage('https://starrybot.xyz/starrybot-slash-commands.gif')

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
			const newRole = await guild.roles.create({name: role})
			finalRoleMapping[role] = existingRoles[newRole.id]
		}
	}

	// Add default roles
	await db.rolesSet(guild.id, finalRoleMapping[desiredRoles[0]], desiredRoles[0], 'native', 'osmo')
	await db.rolesSet(guild.id, finalRoleMapping[desiredRoles[1]], desiredRoles[1], 'native', 'juno')
})

// Just for buttons
client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;

	// They say they've allowed the bot to add Slash Commands,
	//   let's try to add one for this guild and catch it they've lied to us.
	const starryJoin = new SlashCommandBuilder()
		.setName('starry-join')
		.setDescription('Connect your account with Keplr');
	const rest = new REST().setToken(process.env.DISCORD_TOKEN);
	try {
		await rest.put(
			Routes.applicationGuildCommands(interaction.applicationId, interaction.guildId),
			{ body: [starryJoin.toJSON()] },
		);
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
			interaction.reply('Something does not seem right, please try adding StarryBot again.')
		}
		return;
	}

	// Slash command should be added successfully, double-check then tell the channel it's ready
	let enabledGuildCommands = await rest.get(
		Routes.applicationGuildCommands(interaction.applicationId, interaction.guildId)
	);
	console.log('enabledGuildCommands', enabledGuildCommands)

	// Ensure we have the Slash Command registered, then publicly tell everyone they can use it
	for (let enabledGuildCommand of enabledGuildCommands) {
		if (enabledGuildCommand.name === 'starry-join') {
			await interaction.reply('Feel free to use the /starry-join command, friends.')
			break;
		}
	}
});

client.on('interactionCreate', async interaction => {
	console.log('interaction.member', interaction.member);
	if (interaction.isCommand()) {
		console.log('Interaction is a command')
		if (interaction.commandName === 'starry-join') {
			try {
				let results = await logic.hoistRequest({guildId: interaction.guildId, authorId: interaction.member.user.id})
				if (results.error || !results.traveller || !results.saganism) {
					interaction.channel.send(results.error || "Internal error")
				} else {
					// We reply "privately" instead of sending a DM here
					interaction.reply({embeds:[createEmbed(results.traveller,results.saganism)], ephemeral: true})
				}
			} catch(err) {
				logger.error(err)
				await interaction.channel.send("Internal error adding you") // don't send error itself since it could leak secrets
			}
		}
	} else {
		console.log('Interaction is NOT a command')
	}
});

client.on("messageCreate", async message => {
	// ignore messages from bots including self to avoid a botaparadox
	if (message.author.bot) return

	// ignore messages without prefix
	if (message.content.indexOf(db.myConfig.PREFIX) !== 0) return

	// get guild and author
	const {guildId, author } = message;
	if(!guildId || !author) {
		console.error("discord - error something very wrong")
		return
	}

	// handle userland commands

	const args = message.content.slice(db.myConfig.PREFIX.length).trim().split(/ +/g)
	const command = args.shift().toLowerCase()
	const channel = message.channel

	if(!command || !command.length || !channel) {
		logging.error("discord - internal error")
		return
	}

	switch(command) {

		case "starry-drop":
		case "starry-wisdom":
		case "starry-lore":
		case "starry-truthbomb":
			channel.send(Sagan.sagan())
			return

		case "starry":
			try {
				let results = await logic.hoistRequest({guildId:guildId,authorId:author.id})
				if(results.error || !results.traveller || !results.saganism) {
					channel.send(results.error||"Internal error")
				} else {
					author.send({embeds:[createEmbed(results.traveller,results.saganism)]})
					channel.send("Check your DM's")
				}
				logger.info("discord - done starry")
			} catch(err) {
				logger.error(err)
				await channel.send("Internal error adding you") // don't send error itself since it could leak secrets
			}
			return

		case "starry-remove":
		case "starry-delete":
			try {
				await logic.hoistDrop({guildId:guildId,authorId:author.id})
				await channel.send("You've been brought back to earth. (And removed as requested.)")
				logger.info("discord - done starry remove / delete")
			} catch(err) {
				logger.error(err)
				channel.send("Internal error removing you.") // don't send the error since it could leak secrets
			}
			return
	}

	// handle admin commands - this will do for now - TODO improve

	if (!message.member.permissions.has(Permissions.FLAGS.KICK_MEMBERS)) {
		if(command.startsWith("starry")) {
			channel.send("You are not an admin!")
		}
		return
	}

	// find or make a guild associated database record for tracking admin requests around how to deal with users
	let roles = await db.rolesGet(guildId)

	switch(command) {

		case "starry-admin-roles":
			channel.send("Roles I know of")
			roles.forEach(role=>{
				channel.send(role.give_role)
			})
			return

		case "starry-admin-role":
			await db.rolesSet(guildId,args[0])
			channel.send(`Added role`)
			return

		case "starry-admin-delete":
			await db.rolesDelete(guildId,args[0])
			channel.send(`Deleted role`)
			return

		case "starry-admin-members":
			let members = await db.membersAll(guildId)
			members.forEach(member=>{
				channel.send(JSON.stringify(member))
			})
			break

		case "starry-magic":
			// for testing -> could actually also accept a user name and be more useful TODO
			//await logic.hoistFinalize({discord_guild_id:guildId,discord_author_id:authorId},client)
			return
	}

});

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
