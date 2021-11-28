
'use strict';

const db = require("./db")
const logger = require("./logger")
const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed, Permissions } = require('discord.js')
const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);

///
/// Returns a block with { memberId, saganism }
///
/// Or on error either throws an error or returns { error }
///

async function hoistRequest(args) {

	logger.log("hoistRequest");
	logger.log(args)

	let authorId = args.authorId
	let guildId = args.guildId

	// are there any available roles?
	let roles = await db.rolesGet(guildId)
	if(!roles || !roles.length) {
		return {error:"Admin needs to setup roles to give out"}
	}

	// has user already been given a role?
	const member = await db.memberByIdAndGuild({authorId,guildId})
	if(member && member.is_member) {
		return {error:"You already have privileges on this server"}
	}

	// hit me sagan
	let saganism = Sagan.sagan()

	// create a member record
	let memberId = await db.memberAdd({
		discord_account_id: authorId,
		discord_guild_id: guildId,
		saganism: saganism
	})

	// return a nice useful blob to the caller so they can print some stuff out
	return {memberId , saganism }
}

///
/// Allow a remote caller to inquire about a member
///

async function hoistInquire(traveller) {

	// If they didn't send the proper parameter
	if (!traveller) {
		throw "No traveller sent"
		return
	}

	let member = await db.memberBySessionToken(traveller)
	if (!member) {
		throw "No record found"
		return
	}

	const createdAt = member.created_at
	console.log('createdAt', createdAt)
	// TODO: see if they've surpassed their allotted time to respond

	const saganism = member.saganism
	console.log('saganism', saganism)

	return {saganism:saganism, createdAt:createdAt}
}

///
/// And drop a user 
///

async function hoistDrop(args) {
	logger.log("hoistDrop")
	logger.log(args)
	let authorId = args.authorId
	let guildId = args.guildId
	await db.memberDelete({authorId,guildId})
	return {message:"You've been removed"}
}

const { serializeSignDoc } = require('@cosmjs/amino')
const { Secp256k1, Secp256k1Signature, sha256 } = require('@cosmjs/crypto')
const { fromBase64 } = require('@cosmjs/encoding')

///
/// Signing
/// Returns boolean whether the signature is valid or not
///

const isValidSignature = async (signed, signature, publicKey) => {
	let valid = false;
	try {
		// let binaryHashSigned = new Uint8Array(Object.values(hashSigned));
		let binaryHashSigned = sha256(serializeSignDoc(signed));
		let binaryPublicKey = new Uint8Array(Object.values(publicKey));

		valid = await Secp256k1.verifySignature(
			Secp256k1Signature.fromFixedLength(fromBase64(signature)),
			binaryHashSigned,
			binaryPublicKey,
		);
	} catch (e) {
		console.error('Issue trying to verify the signature', e);
	} finally {
		return valid;
	}
}

///
/// Returns boolean whether the user signed the right thing
///

const isCorrectSaganism = async (traveller, signed) => {
	let isCorrect = false;
	try {
		// What they signed
		const signedSaganism = signed.msgs[0].value;
		let member = await db.memberBySessionToken(traveller)
		if (!member) {
			// Don't even have a row for this ID - sad
			return false;
		}
		// What they should have signed
		const assignedSaganism = member.saganism;
		isCorrect = signedSaganism === assignedSaganism;
	} catch (e) {
		console.error('Issue determining if the user signed the right thing', e);
	} finally {
		return isCorrect;
	}
}

///
/// Finalize hoist
///

async function hoistFinalize(blob,client) {

	logger.log("hoistFinalize");
	logger.log(blob)

	const {traveller, signed, signature, publicKey} = blob;

	// get member
	let member = await db.memberBySessionToken(traveller)
	console.log('hoistFinalize::memberr', member)

	if (!member) {
		logger.error("discord::hoist - no member")
		return {error:"Member not found"}
	}

	if(!member.discord_guild_id || !member.discord_account_id) {
		logger.error("discord::hoist - incomplete params")
		return {error:"incomplete params"}
	}

	const createdAt = member.created_at;
	console.log('createdAt', createdAt)
	// TODO: see if they've surpassed their allotted time to respond ...

	const saganism = member.saganism;
	console.log('saganism', saganism)

	// already validated?
	if(member.is_member) {
		return {error:"You're already validated on this server!"}
	}

	// is signature valid?
	const validSignature = await isValidSignature(signed, signature, publicKey);
	if (!validSignature) {
		logger.error("discord::hoist - bad sig")
		return {error:"Bad request, you're grounded"}
	}
	logger.log('Valid signature, checking if signed correct thing...')

	// Use "traveller" and "signed" to see if they're signing the right thing according to the database.
	const signedCorrectSaganism = await isCorrectSaganism(traveller, signed);
	if (!signedCorrectSaganism) {
		logger.error("discord::hoist - bad sagan")
		return {error:"Signing error"}
	}

	// get all possible roles
	let roles = await db.rolesGet(guildId)
	if(!roles || !roles.length) {
		return {error:"Admin needs to setup roles to give out"}
	}

	// get guild
	const guild = await client.guilds.fetch(member.discord_guild_id)
	if(!guild) {
		logger.error("discord::hoist - cannot find guild");
		return {error:"cannot find guild"}
	}

	// get all guild roles
	const everyoneRole = guild.roles.everyone

	//
	// Add a role to user
	//
	// Notes:
	// https://discordjs.guide/popular-topics/faq.html#how-do-i-unban-a-user
	// const role = interaction.options.getRole('role');
	// const member = interaction.options.getMember('target');
	// member.roles.add(role);
	//

	roles.forEach(role => {
		let rolename = role.give_role
		let rolediscord = message.guild.roles.cache.find(r => r.name === rolename)
		if(!rolediscord) {
			channel.send("Hmm, starrybot cannot find role " + rolename)
		} else {
			logger.log("Adding user to role " + rolename)

			// discord_user.roles.add(role).catch(console.error);

			// It makes sense to ALSO send them an invite code?
			//try {
			//	const invite = await channel.createInvite({maxUses: 1 });
			//	let url = `https://discord.gg/${invite.code}`
			//	await message.author.send(url)
			//} catch(e) {
			//	logger.error(e)
			//}
			//logger.log("invite sent")
		}
	})

	return {success:"done"}
}

module.exports = { hoistRequest, hoistInquire, hoistDrop, hoistFinalize }

