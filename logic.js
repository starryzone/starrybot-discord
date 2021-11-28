
'use strict';

const db = require("./db")
const logger = require("./logger")
const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed, Permissions } = require('discord.js')
const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);

async function hoistSession(args) {

	// If they didn't send the proper parameter
	if (!args.traveller) {
		throw "No traveller sent"
		return
	}

	let rowInfo = await db.getRowBySessionToken(args.traveller)
	console.log('rowInfo', rowInfo)
	if (rowInfo.length === 0) {
		throw "No record found"
		return
	}

	const createdAt = rowInfo[0].created_at
	console.log('createdAt', createdAt)

	// TODO: see if they've surpassed their allotted time to respond
	const saganism = rowInfo[0].saganism
	console.log('saganism', saganism)

	return {saganism:saganism, createdAt:createdAt}
}

///
/// Returns a block with { validatorURL, sessionId, saganism }
///
/// Or on error either throws an error or returns { error }
///

async function hoistRequest(args) {

	logger.log("hoistRequest");
	logger.log(args)

	let guildId = args.guildId
	let authorId = args.authorId

	// get information about what admin would like to do to the user
	let disco = await db.guildGet(guildId)
	if(!disco) {
		logger.error("discord::hoisting - error - something horribly wrong 1!")
		return {error:"Starrybot internal error"}
	}

	// does user already have those roles? TODO -> would be smarter to ask discord itself!
	const memberExists = await db.memberExists(authorId, guildId)

	if (memberExists && memberExists.length !== 0) {
		return {error:"You're already validated on this server!"}
	}

	// get url
	let validatorURL = disco.validatorURL

	// get a funny quote
	let saganism = Sagan.sagan()

	// create session
	let sessionId = await db.memberAdd({
		discord_account_id: authorId,
		discord_guild_id: guildId,
		saganism: saganism
	})

	// return useful blob
	return {validatorURL, sessionId , saganism }
}

async function hoistDrop(args) {
	logger.log("hoistDrop");
	logger.log(args)
	await db.memberDelete(args.authorId, args.guildId)
	return {message:"You've been removed"}
}


const { serializeSignDoc } = require('@cosmjs/amino')
const { Secp256k1, Secp256k1Signature, sha256 } = require('@cosmjs/crypto')
const { fromBase64 } = require('@cosmjs/encoding')

async function hoistFinalize(session,client) {

	logger.log("hoistFinalize");
	logger.log(blob)

	// find the session if needed (a caller can pass a session token instead of the actual session)

	if(session.session_token) {

		session = await db.getRowBySessionToken(args.session_token)

		console.log('rowInfo', session)

		if (session.length === 0) {
			return {error:"Record not found"}
		}

		const createdAt = session[0].created_at;
		console.log('createdAt', createdAt)

		const saganism = session[0].saganism;
		console.log('saganism', saganism)

	}

	// session is an object that should contain a guild, a user, a time, and a signature

	if(!session.discord_guild_id || !session.discord_account_id) {
		logger.error("discord::hoist - incomplete params")
		return {error:"incomplete params"}
	}

	// get information about what admin would like to do to the user
	let disco = db.guildGet(session.discord_guild_id)
	if(!disco) {
		logger.error("discord::hoist - cannot find our record")
		return {error:"cannot find our record"}
	}

	// does user already have those roles? TODO -> would be smarter to ask discord itself!
	const memberExists = await db.memberExists(session.discord_account_id, session.discord_guild_id)

	if (memberExists && memberExists.length !== 0) {
		return {error:"You're already validated on this server!"}
	}

	// TODO: see if they've surpassed their allotted time to respond ... again

	//
	// TODO: check signature
	//
	// const valid = await Secp256k1.verifySignature(
	// Secp256k1Signature.fromFixedLength(fromBase64(signature.signature)),
	// sha256(serializeSignDoc(signed)),
	// this.accounts[0].pubkey,
	// );
	//

	// find guild

	const guild = await client.guilds.fetch(session.discord_guild_id)
	if(!guild) {
		logger.error("discord::hoist - cannot find guild");
		return {error:"cannot find guild"}
	}

	// get roles
	const everyoneRole = guild.roles.everyone

	// find channel
	//let channel = 0
	//if(disco.channelId && disco.channelId.length) {
	//	channel = await guild.channels.cache.get(disco.channelId)
	//	if(!channel) {
	//		logger.error("discord::hoist - cannot find channel");
	//		return {error:"cannot find channel"}
	//	}
	//}

	// as a test elevate them now to a specified room if any
	//if(channel) {
	//	await channel.permissionOverwrites.set([{ id: message.author.id , allow: ['VIEW_CHANNEL'] }])
	//	logger.log("discord::hoist - added to a channel explicitly")
	//}

	//
	// Add a role to user
	//
	// Notes:
	// https://discordjs.guide/popular-topics/faq.html#how-do-i-unban-a-user
	// const role = interaction.options.getRole('role');
	// const member = interaction.options.getMember('target');
	// member.roles.add(role);
	//

	if(disco.role && disco.role.length) {
		let role = message.guild.roles.cache.find(r => r.name === disco.role)
		if(!role) {
			channel.send("Hmm, starrybot cannot find role " + disco.role)
		} else {
			//let member = message.mentions.members.first();
			//message.member.roles.add(role).catch(console.error);
		}
	}

	// It makes sense to ALSO send them an invite code?
	try {
		const invite = await channel.createInvite({maxUses: 1 });
		let url = `https://discord.gg/${invite.code}`
		await message.author.send(url)
	} catch(e) {
		logger.error(e)
	}
	logger.log("invite sent")

	return {success:"done"}
}

module.exports = { hoistSession, hoistRequest, hoistDrop, hoistFinalize }

