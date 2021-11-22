'use strict';

const db = require("./db");

////////////////////////////////
// Create a Winston logger that streams to Stackdriver Logging
////////////////////////////////

let logger = {
	info: (...args) => console.info(...args),
	log: (...args) => console.log(...args),
	err: (...args) => console.error(...args),
	error: (...args) => console.error(...args),
}

if (db.myConfig.WINSTON) {
	const winston = require('winston');
	const {LoggingWinston} = require('@google-cloud/logging-winston');
	const loggingWinston = new LoggingWinston();
	const wlog = winston.createLogger({
		level: 'info',
		transports: [new winston.transports.Console(), loggingWinston],
	});
	logger.info = (...args) => wlog.info(...args)
	logger.log = (...args) => wlog.info(...args)
	logger.err = (...args) => wlog.log('error',...args)
	logger.error = (...args) => wlog.log('error',...args)
}

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

let pool = 0;

app.use(async (req, res, next) => {
	if (pool) {
		return next();
	}
	try {
		pool = await db.createPoolAndEnsureSchema()
		next()
	} catch (err) {
		logger.error(err)
		return next(err)
	}
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
			res.sendStatus(400)
		} else {
			let rowInfo = await db.getRowBySessionToken(req.body.traveller)
			console.log('rowInfo', rowInfo)
			if (rowInfo.length === 0) {
				res.sendStatus(400)
			}

			const createdAt = rowInfo[0].created_at;
			console.log('createdAt', createdAt)
			// TODO: see if they've surpassed their allotted time to respond
			const saganism = rowInfo[0].saganism;
			console.log('saganism', saganism)

			res.send({saganism, createdAt});
			// let results = signing_dowork();
		}
	} catch (e) {
		console.warn('Error hitting starry-backend', e)
	}

})

app.post('/keplr-signed', (req, res) => {
	let allIsGood = true
	if (allIsGood) {
		res.sendStatus(200)
	} else {
		// Bad Request, you're grounded
		res.sendStatus(400)
	}
})

const PORT = db.myConfig.PORT || 8080;
const server = app.listen(PORT, () => {
	logger.info(`App listening on port ${PORT}`)
})

module.exports = server

////////////////////////////////
// The Discord bot
////////////////////////////////

const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed } = require('discord.js')
const {myConfig} = require("./db");

const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);
const client = new Client({intents: intents })

client.on("ready", () => {
	logger.info(`StarryBot has star(ry)ted.`)
});

client.on("messageCreate", async message => {
	if (message.author.bot) return
	if (message.content.indexOf(db.myConfig.PREFIX) !== 0) return

	const {guildId, author } = message;
	const args = message.content.slice(db.myConfig.PREFIX.length).trim().split(/ +/g)
	const command = args.shift().toLowerCase()

	switch(command) {
		case "sm":
			let uuid = author.id
			const memberExists = await db.memberExists(uuid, guildId);

			if (memberExists.length !== 0) {
				message.channel.send("You're already validated on this server :)")
				break
			}
			let sagan = Sagan.sagan()
			let sessionId = await db.memberAdd({
				discord_account_id: uuid,
				discord_guild_id: guildId,
				saganism: sagan
			})
			let url = `https://cosmos-webapp.pages.dev/?traveller=${sessionId}`

			const exampleEmbed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`Please visit: ${url}`)
				.setURL(url)
				.setAuthor('Starrybot', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
				.setDescription(sagan)
				.setThumbnail('https://i.imgur.com/AfFp7pu.png')
				.setTimestamp()
				.setFooter('Put your helmet on', 'https://i.imgur.com/AfFp7pu.png');

			await message.channel.send("Check your DM's");
			await message.author.send({ embeds: [exampleEmbed] });
			break
		case "delme":
			await db.memberDelete(author.id, guildId)
			await message.channel.send("You've been brought back to earth. (And removed as requested.)")
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
