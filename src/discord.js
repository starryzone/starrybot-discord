
'use strict';

const db = require("./db")
const logger = require("./logger")
const logic = require("./logic")
const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed, Permissions } = require('discord.js')
const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);
const client = new Client({intents: intents })

let validatorURL = db.myConfig.VALIDATOR

function createEmbed(traveller,saganism) {
	let url = validatorURL + traveller
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

client.on("ready", () => {
	logger.info(`StarryBot has star(ry)ted.`)
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
