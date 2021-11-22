
'use strict';

const myconfig = require("./auth.json");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Create a Winston logger that streams to Stackdriver Logging
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let logger = {
	info: (...args) => { console.info(...args) },
	log: (...args) => { console.log(...args) },
	err: (...args) => { console.error(...args) },
	error: (...args) => { console.error(...args) },
}

if(myconfig.WINSTON) {
	const winston = require('winston');
	const {LoggingWinston} = require('@google-cloud/logging-winston');
	const loggingWinston = new LoggingWinston();
	const wlog = winston.createLogger({
		level: 'info',
		transports: [new winston.transports.Console(), loggingWinston],
	});
	logger.info = (...args) => { wlog.log(...args) }
	logger.log = (...args) => { wlog.log(...args) }
	logger.err = (...args) => { wlog.info('error',...args) }
	logger.error = (...args) => { wlog.info('error',...args) }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// database
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const Knex = require('knex')

const createPool = async () => {

	let knexargs = {
		client: 'pg',
		connection: {
			user: myconfig.DB_USER,
			password: myconfig.DB_PASS,
			database: myconfig.DB_NAME,
			host: myconfig.DB_HOSTIP,
			port: myconfig.DB_HOSTPORT,
		},
		pool: {
			max: 5,
			min: 5,
			acquireTimeoutMillis: 60000,
			createTimeoutMillis: 30000,
			idleTimeoutMillis: 600000,
			createRetryIntervalMillis: 200,
		}
	}

	return Knex(knexargs)
}

const createPoolAndEnsureSchema = async () => {
	try {
		let pool = await createPool()
		const hasTable = await pool.schema.hasTable(myconfig.DB_TABLENAME)
		if (!hasTable) {
			return pool.schema.createTable(myconfig.DB_TABLENAME, table => {
				table.increments('id').primary()
				table.text('discord_account_id').notNullable()
				table.timestamp('created_at').defaultTo(pool.fn.now())
				table.uuid('session_token').notNullable()
				table.text('saganism', 'mediumtext').notNullable()
				table.boolean('is_member')
			})
		}
		return pool
	} catch(err) {
		logger.error(err);
		throw err;
	}
	return 0
}

const insertSomething = async (pool, record) => {
	try {
		return await pool(myconfig.DB_TABLENAME).insert(record);
	} catch (err) {
		throw Error(err);
	}
};

const getVotes = async pool => {
	return await pool
		.select('candidate', 'time_cast')
		.from(myconfig.DB_TABLENAME)
		.orderBy('time_cast', 'desc')
		.limit(5);
};

const getVoteCount = async (pool, candidate) => {
	return await pool(myconfig.DB_TABLENAME).count('vote_id').where('candidate', candidate);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// SessionID
// Math.random should be unique because of its seeding algorithm.
// Convert it to base 36 (numbers + letters), and grab the first 9 characters
// after the decimal.
/////////////////////////////////////////////////////////////////////////////////////////////////////////

var SessionID = function () {
	return '_' + Math.random().toString(36).substr(2, 9);
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// database wrapper - model
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let hack = {}

let database = {
	member_exists: (uuid) => {
		return hack[uuid] ? true : false
	},
	member_add: (uuid,quote,date) => {
		let sessionid = SessionID()
		hack[uuid] = {
			sessionid: sessionid,
			quote: quote,
			date: date
		}
		return sessionid
	},
	member_delete: (uuid) => {
		delete hack[uuid]
		return 0
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// signing stuff
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const { serializeSignDoc } = require('@cosmjs/amino')
const { Secp256k1, Secp256k1Signature, sha256 } = require('@cosmjs/crypto')
const { fromBase64 } = require('@cosmjs/encoding')

function signing_dowork(args) {
	return 'I could have access to your database rows because I am a message from the backend. Sincerely, the backend'
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// express app
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const express = require('express')
const cors = require('cors')
const app = express()

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
		pool = await createPoolAndEnsureSchema()
		next()
	} catch (err) {
		logger.error(err)
		return next(err)
	}
})

app.get('/starry-backend', (req, res) => {

	// TODO
	//
	// https://cosmos-webapp.pages.dev/?session=session
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

	let results = signing_dowork();

	res.send({ express: results });
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

const PORT = myconfig.PORT || 8080;
const server = app.listen(PORT, () => {
	logger.info(`App listening on port ${PORT}`)
})

module.exports = server

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// The bot
/////////////////////////////////////////////////////////////////////////////////////////////////////////

const Sagan = require("./sagan.js")

const { Client, Intents, MessageEmbed } = require('discord.js')

const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);
const client = new Client({intents: intents }) 

client.on("ready", () => {
	logger.info(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`)
});

client.on("message", async message => {
	if(message.author.bot) return
	if(message.content.indexOf(myconfig.PREFIX) !== 0) return
	const args = message.content.slice(myconfig.PREFIX.length).trim().split(/ +/g)
	const command = args.shift().toLowerCase()

	switch(command) {
		case "starry":

			let uuid = message.author.uuid
			if(database.member_exists(uuid)) {
				message.channel.send("You're already validated!")
				break
			}

			let sagan = Sagan.sagan()
			let sessionid = database.member_add(uuid,sagan,Date.now())
			let url = `https://cosmos-webapp.pages.dev/?sessionid=${sessionid}`

			const exampleEmbed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Please visit: https://cosmos-webapp.pages.dev')
				.setURL(url)
				.setAuthor('Starrybot', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
				.setDescription(sagan)
				.setThumbnail('https://i.imgur.com/AfFp7pu.png')
				//.addFields(
				//	{ name: 'Regular field title', value: 'Starry Invite' },
				//	{ name: '\u200B', value: '\u200B' },
				//	{ name: 'Inline field title', value: 'Acceleration on', inline: true },
				//	{ name: 'Inline field title', value: 'Can you hear us Major Tom', inline: true },
				//	{ name: 'Inline field title', value: sagan, inline: true },
				//)
				//.addField('Inline field title', 'Planet Earth is Blue', true)
				//.setImage('https://i.imgur.com/AfFp7pu.png')
				.setTimestamp()
				.setFooter('Put your helmet on', 'https://i.imgur.com/AfFp7pu.png');

			message.channel.send("Check your dm's");
			message.author.send({ embeds: [exampleEmbed] });
			break
		case "deleteme":
			database.member_delete(message.author.uuid)
			message.channel.send("You've been brought back to earth")
			//message.author.send("You've been brought back to earth")
			break
	}

});

client.login(myconfig.DISCORD_TOKEN)










////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// a silly test unused
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
app.get('/test',async(req,res) => {
	res.status(200).send("key is " + myconfig.DB_KEY);
})

app.get('/', async (req, res) => {
	logger.info("homepage requested");
	try {
		pool = pool || (await createPoolAndEnsureSchema());
	} catch(e) {
		logger.error("failed to get homepage due to cannot connect to db");
		logger.error(JSON.stringify(e));
		res.status(200).send(JSON.stringify(e)).end();
		return
	}
	if(!pool) {
		console.error("no pool")
		logger.error("failed to get homepage due to cannot connect to db2");
		res.status(200).send("nodb").end();
		return
	}
	try {
		// Query the total count of "TABS" from the database.
		const tabsResult = await getVoteCount(pool, 'TABS');
		const tabsTotalVotes = parseInt(tabsResult[0].count);
		// Query the total count of "SPACES" from the database.
		const spacesResult = await getVoteCount(pool, 'SPACES');
		const spacesTotalVotes = parseInt(spacesResult[0].count);
		// Query the last 5 votes from the database.
		const votes = await getVotes(pool);
		// Calculate and set leader values.
		let leadTeam = '';
		let voteDiff = 0;
		let leaderMessage = '';
		if (tabsTotalVotes !== spacesTotalVotes) {
		if (tabsTotalVotes > spacesTotalVotes) {
			leadTeam = 'TABS';
			voteDiff = tabsTotalVotes - spacesTotalVotes;
		} else {
			leadTeam = 'SPACES';
			voteDiff = spacesTotalVotes - tabsTotalVotes;
		}
		leaderMessage =
			`${leadTeam} are winning by ${voteDiff} vote` + voteDiff > 1 ? 's' : '';
		} else {
			leaderMessage = 'TABS and SPACES are evenly matched!';
		}

		let data = {
			votes: votes,
			tabsCount: tabsTotalVotes,
			spacesCount: spacesTotalVotes,
			leadTeam: leadTeam,
			voteDiff: voteDiff,
			leaderMessage: leaderMessage,
		}
		console.log("got results")
		console.log(data)

		res.status(200).send(JSON.stringify(data)).end();

	} catch (err) {
		console.log(err)
		logger.error(err);
		res
			.status(500)
			.send('Unable to load page; see logs for more details.')
			.end();
	}
});

app.get('/tabs', async (req, res) => {
	pool = pool || (await createPoolAndEnsureSchema());

	// Get the team from the request and record the time of the vote.
	let team = "TABS"

	const timestamp = new Date();

	if (!team || (team !== 'TABS' && team !== 'SPACES')) {
		res.status(400).send('Invalid team specified.').end();
		return;
	}

	// Create a vote record to be stored in the database.
	const vote = {
		candidate: team,
		time_cast: timestamp,
	};

	// Save the data to the database.
	try {
		await insertSomething(pool, vote);
	} catch (err) {
		logger.error(`Error while attempting to submit vote:${err}`);
	res
		.status(500)
		.send('Unable to cast vote; see logs for more details.')
		.end();
		return;
	}
	res.status(200).send(`Successfully voted for ${team} at ${timestamp}`).end();
});
*/
