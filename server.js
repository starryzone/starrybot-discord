'use strict';

const db = require("./db");

const logger = require("./logger")

////////////////////////////////
// signing stuff
////////////////////////////////

const { serializeSignDoc } = require('@cosmjs/amino')
const { Secp256k1, Secp256k1Signature, sha256 } = require('@cosmjs/crypto')
const { fromBase64 } = require('@cosmjs/encoding')

function signing_dowork(args) {
	// TODO: the next task to do :)
	return 'I could have access to your database rows because I am a message from the backend. Sincerely, the backend'
}

////////////////////////////////
// business logic
////////////////////////////////


////////////////////////////////
// express app
////////////////////////////////

const express = require('express')
const cors = require('cors')
const app = express()
app.use(express.static('public'))

// There's probably some settings we can customize for cors here
app.use(cors())

app.enable('trust proxy')
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use((req, res, next) => {
	res.set('Content-Type', 'text/html')
	next()
})

app.use(async (req, res, next) => {
	db.ensureDatabaseInitialized()
	next()
})

app.post('/starry-backend', async (req, res) => {

	// TODO
	//
	// https://cosmos-webapp.pages.dev/?traveller=session
	//
	// is this a valid uuid?
	// ask db for carl sagan phrase
	// check time stamp
	// if error then say error
	//
	// if ok then
	//		turn on sign button
	//    signature = please sign this msg
	//    blob = {
	//		  session
	//		  signed message
	//	   	signature
	//    }
	//    send to https://queenbot.uc.r.appspot.com/starry-backend
	//

	console.log('req.body', req.body);

	try {
		// If they didn't send the proper parameter
		if (!req.body.traveller) {
			res.sendStatus(400);
		} else {
			let rowInfo = await db.getRowBySessionToken(req.body.traveller)
			console.log('rowInfo', rowInfo)
			if (rowInfo.length === 0) {
				res.sendStatus(400);
				return;
			}

			const createdAt = rowInfo[0].created_at;
			console.log('createdAt', createdAt)
			// TODO: see if they've surpassed their allotted time to respond
			const saganism = rowInfo[0].saganism;
			console.log('saganism', saganism)

			res.send({saganism, createdAt});
		}
	} catch (e) {
		console.warn('Error hitting starry-backend', e)
	}

})

app.post('/keplr-signed', async (req, res) => {
		const {traveller, signed, signature, publicKey} = req.body;

		const validSignature = await isValidSignature(signed, signature, publicKey);
		if (!validSignature) {
			// Bad Request, you're grounded
			return res.status(400);
		}
		console.log('Valid signature, checking if signed correct thing…')
		// Valid signature, on to the next checks…
		// Use "traveller" and "signed" to see if they're signing the right thing according to the database.
		const signedCorrectSaganism = await isCorrectSaganism(traveller, signed);
		if (!signedCorrectSaganism) {
			return res.status(400);
		}
		console.log('Signed correct thing, checking if user should be elevated…')
		// Finally, check to see if the user should be elevated in Discord (talk to blockchain)
		// TODO: look at some database table or settings that defines which token should exist and which role should be assigned
		res.sendStatus(200)
})

const PORT = db.myConfig.PORT || 8080;
const server = app.listen(PORT, () => {
	logger.info(`App listening on port ${PORT}`)
})

module.exports = server

// Returns boolean whether the signature is valid or not
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

// Returns boolean whether the user signed the right thing
const isCorrectSaganism = async (traveller, signed) => {
	let isCorrect = false;
	try {
		// What they signed
		const signedSaganism = signed.msgs[0].value;
		let rowInfo = await db.getRowBySessionToken(traveller)
		if (rowInfo.length === 0) {
			// Don't even have a row for this session ID
			return false;
		}
		// What they should have signed
		const assignedSaganism = rowInfo[0].saganism;
		isCorrect = signedSaganism === assignedSaganism;
	} catch (e) {
		console.error('Issue determining if the user signed the right thing', e);
	} finally {
		return isCorrect;
	}
}


////////////////////////////////
// The Discord bot
////////////////////////////////

const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed, Permissions } = require('discord.js')
const {myConfig} = require("./db");

const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);
const client = new Client({intents: intents })

client.on("ready", () => {
	logger.info(`StarryBot has star(ry)ted.`)
});

client.on("messageCreate", async message => {
	if (message.author.bot) return
	if (message.content.indexOf(db.myConfig.PREFIX) !== 0) return

	// peel a few details out of the message
	const {guildId, author } = message;
	const args = message.content.slice(db.myConfig.PREFIX.length).trim().split(/ +/g)
	const command = args.shift().toLowerCase()

	// since this bot serves many masters, go ahead and find which server is involved here
	let disco = db.guildGet(guildId)

	switch(command) {

		case "starry-quote":
			message.channel.send(Sagan.sagan())
			break

		case "starry":
			let uuid = author.id
			const memberExists = await db.memberExists(uuid, guildId);

			if (memberExists.length !== 0) {
				// TODO it may be possible to ask discord rather than asking our own database - more stable
				message.channel.send("You're already validated on this server :)")
				break

			} else {

				// get a funny quote
				let sagan = Sagan.sagan()

				// create a session in db
				let sessionId = await db.memberAdd({
					discord_account_id: uuid,
					discord_guild_id: guildId,
					saganism: sagan
				})

				// tell user to go to validator site
				const exampleEmbed = new MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`Please visit: ${disco.validatorURL+sessionId}`)
					.setURL(disco.validatorURL)
					.setAuthor('Starrybot', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
					.setDescription(sagan)
					.setThumbnail('https://i.imgur.com/AfFp7pu.png')
					.setTimestamp()
					.setFooter('Put your helmet on', 'https://i.imgur.com/AfFp7pu.png');

				// send it privately
				await message.author.send({ embeds: [exampleEmbed] });

				// but also tell them to check their dms publically
				await message.channel.send("Check your DM's");

			}

			break

		case "starry-delete":
			// tell them first in case of crash
			await message.channel.send("You've been brought back to earth. (And removed as requested.)")
			// then attempt remove
			await db.memberDelete(author.id, guildId)
			break

		case "starry-admin":
			message.channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-admin-validator":
			// TODO RESTRICT
			disco.validatorURL = args[0]
			db.guildSet(disco)
			message.channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-admin-channel":
			// TODO RESTRICT
			disco.channelId = args[0]
			db.guildSet(disco)
			message.channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-admin-role":
			// TODO RESTRICT
			disco.role = args[0]
			db.guildSet(disco)
			message.channel.send(`Validator url is ${disco.validatorURL} and room number is ${disco.channelId} and role is ${disco.role}`);
			break

		case "starry-magic":

///
/// request to our backend, localhost:5000 with info
   //   //   we'll copy the code stuffs below
///      const valid = await Secp256k1.verifySignature(
    //    Secp256k1Signature.fromFixedLength(fromBase64(signature.signature)),
    //    sha256(serializeSignDoc(signed)),
     //   this.accounts[0].pubkey,
     // );
///

			// As a test, immediately add the person who sent the message to the secret channel
			const guild = await client.guilds.fetch(guildId)
			const everyoneRole = guild.roles.everyone
			const channel = await guild.channels.cache.get(disco.channelId)
			await channel.permissionOverwrites.set([{ id: message.author.id , allow: ['VIEW_CHANNEL'] }])
			logger.log("elevated perms")

			// It makes sense to ALSO send them an invite code?
			try {
				const guild = await client.guilds.fetch(guildId);
				const channel = await guild.channels.cache.get(disco.channelId);
				const invite = await channel.createInvite({maxUses: 1 });
				let url = `https://discord.gg/${invite.code}`
				await message.author.send(url)
			} catch(e) {
				logger.error(e)
			}
			logger.log("invite sent")

			// There is an idea of adding a "ROLE" to a user.

//https://discordjs.guide/popular-topics/faq.html#how-do-i-unban-a-user
//const role = interaction.options.getRole('role');
//const member = interaction.options.getMember('target');
//member.roles.add(role);

			if(disco.role) {
				let role = message.guild.roles.cache.find(r => r.name === disco.role)
				if(!role) {
					message.channel.send("Hmm, cannot find role " + disco.role)
				} else {
					let member = message.mentions.members.first();
					message.member.roles.add(role).catch(console.error);
				}
			}
			break
	}

});

const login = async () => {
	const loggedInToken = await client.login(db.myConfig.DISCORD_TOKEN)
	if (loggedInToken !== myConfig.DISCORD_TOKEN) {
		console.warn('There might be an issue with the Discord login')
		return false
	} else {
		return true
	}
}

login().then((res) => {
	if (res) {
		console.log('Connected to Discord')
	} else {
		console.log('Issue connecting to Discord')
	}
})
