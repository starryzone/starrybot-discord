
'use strict';

const myconfig = require("./auth.json");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Create a Winston logger that streams to Stackdriver Logging
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const winston = require('winston');
const {LoggingWinston} = require('@google-cloud/logging-winston');
const loggingWinston = new LoggingWinston();
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console(), loggingWinston],
});

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
			port: myconfig.DB_PORT,
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
				table.increments('vote_id').primary()
				table.timestamp('time_cast', 30).notNullable()
				table.specificType('candidate', 'CHAR(6)').notNullable()
			})
		}
		return pool
	} catch(err) {
		logger.log('error',err);
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// express glue
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
		logger.log('error',err)
		return next(err)
	}
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// a silly test
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/test',async(req,res) => {
	res.status(200).send("key is " + myconfig.DB_KEY);
})

app.get('/', async (req, res) => {
	logger.info("homepage requested");
	try {
		pool = pool || (await createPoolAndEnsureSchema());
	} catch(e) {
		logger.log('error',"failed to get homepage due to cannot connect to db");
		logger.log('error',JSON.stringify(e));
		res.status(200).send(JSON.stringify(e)).end();
		return
	}
	if(!pool) {
		console.error("no pool")
		logger.log('error',"failed to get homepage due to cannot connect to db2");
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
		logger.log('error',err);
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
		logger.log('error',`Error while attempting to submit vote:${err}`);
	res
		.status(500)
		.send('Unable to cast vote; see logs for more details.')
		.end();
		return;
	}
	res.status(200).send(`Successfully voted for ${team} at ${timestamp}`).end();
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// the signing stuff
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const { serializeSignDoc } = require('@cosmjs/amino')
const { Secp256k1, Secp256k1Signature, sha256 } = require('@cosmjs/crypto')
const { fromBase64 } = require('@cosmjs/encoding')

app.get('/starry-backend', (req, res) => {
	res.send({ express: 'I could have access to your database rows because I am a message from the backend. Sincerely, the backend' });
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

const { Client, Intents } = require('discord.js')

const intents = new Intents([ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ]);
const client = new Client({intents: intents }) 

client.on("ready", () => {
	logger.info(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`)
});

client.on("message", async message => {

	// ignore messages not from bots
	if(message.author.bot) return

	// ignore messages not with prefix
	if(message.content.indexOf(myconfig.prefix) !== 0) return

	// get message
	const args = message.content.slice(myconfig.prefix.length).trim().split(/ +/g)
	const command = args.shift().toLowerCase()

	// handle starme command
	if(command === "starme") {

		let uuid = message.author.uuid
		

		const m = await message.channel.send("Ping?")
		m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`)

	}

	if(command == "deleteme") {
		// delete the user
	}

	// wait for !starme
	//	uuid = get persons
	// 	are they in the db?
	//	if in the db
	//		you are already in?
	//	if not
	// 		session = generate a session token
	//		phrase = do a carl sagan ipsum; and make 3 sentences
	//		timestamp = ?
	//		write session and phrase to db
	//		url = https://cosmos-webapp.pages.dev?session=session
	//		print url to user as a dm -> send a dm
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

});

client.login(myconfig.DISCORD_TOKEN)
