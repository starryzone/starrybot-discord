
'use strict';

const db = require("./db")
const logger = require("./logger")
const logic = require("./logic")
const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed, Permissions } = require('discord.js')
const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);
const client = new Client({intents: intents })

function createEmbed(args) {
	return new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Please visit: ${args.validatorURL+args.sessionId}`)
		.setURL(args.validatorURL)
		.setAuthor('Starrybot', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
		.setDescription(args.saganism)
		.setThumbnail('https://i.imgur.com/AfFp7pu.png')
		.setTimestamp()
		.setFooter('Put your helmet on', 'https://i.imgur.com/AfFp7pu.png');
}

client.on("ready", () => {
	logger.info(`StarryBot has star(ry)ted.`)
});

client.on("messageCreate", async message => {

	// prime db here just in case
	await db.ensureDatabaseInitialized()

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

		case "starry-say":
			channel.send(Sagan.sagan())
			return

		case "starry":
			try {
				let results = await logic.hoistRequest({guildId:guildId,authorId:author.id})
				if(results.error || !results.sessionId) {
					channel.send(results.error||"Internal error")
				} else {
					author.send({embeds:[createEmbed(results)]})
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

	// handle admin commands

	if (!message.member.hasPermission("ADMINISTRATOR")) {
		return
	}

	// find or make a guild associated database record for tracking admin requests around how to deal with users
	let disco = await db.guildGet(guildId)

	switch(command) {

		case "starry-admin":
			channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-admin-validator":
			disco.validatorURL = args[0]
			await db.guildSet(disco)
			channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-admin-channel":
			disco.channelId = args[0]
			await db.guildSet(disco)
			channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-admin-role":
			disco.role = args[0]
			await db.guildSet(disco)
			channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-magic":
			// for testing -> could actually also accept a user name and be more useful TODO
			await logic.hoistFinalize({discord_guild_id:guildId,discord_author_id:authorId},client)
			break
	}

});

const login = async () => {
	const loggedInToken = await client.login(db.myConfig.DISCORD_TOKEN)
	if (loggedInToken !== db.myConfig.DISCORD_TOKEN) {
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
