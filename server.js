
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
// database wrapper - model
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let hack = {}

let database = {
	member_exists: (uuid) => {
		return hack[uuid] ? true : false
	},
	member_add: (uuid,sessionid,quote,date) => {
		hack[uuid] = {
			sessionid: sessionid,
			quote: quote,
			date: date
		}
	},
	member_delete: (uuid) => {
		delete hack[uuid]
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// signing stuff
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// actually start the express app
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const PORT = myconfig.PORT || 8080;
const server = app.listen(PORT, () => {
	logger.info(`App listening on port ${PORT}`)
})

module.exports = server

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// sagan ipsum
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let Ipsum = {
  title: 'Sagan Ipsum - Now with Latin nebulas!',
  head: 'Sagan Ipsum',
  subhead: 'The Cosmos Awaits',
  words: [
  	'billions upon billions',
  	'galaxies',
  	'consciousness',
  	'science',
  	'light years',
  	'cosmos',
  	'rogue',
  	'quasar',
  	'culture',
  	'explorations',
  	'worldlets',
  	'Vangelis',
  	'a billion trillion',
  	'Hypatia',
  	'birth',
  	'Flatland',
  	'tesseract',
  	'Rig Veda',
  	'decipherment',
  	'billions upon billions',
  	'trillion',
  	'radio telescope',
  	'prime number',
  	'colonies',
  	'cosmic fugue',
  	'extraplanetary',
  	'corpus callosum',
  	'Drake Equation',
  	'Jean-François Champollion',
  	'Cambrian explosion',
  	'Tunguska event',
  	'of brilliant syntheses',
  	'circumnavigated',
  	'Euclid',
  	'Apollonius of Perga',
  	'hydrogen atoms',
  	'astonishment',
  	'venture',
  	'white dwarf'
  ],

  phrases : [
  	'tingling of the spine',
  	'tendrils of gossamer clouds',
  	'ship of the imagination',
  	'realm of the galaxies',
  	'laws of physics',
  	'rich in mystery',
  	'cosmic ocean',
  	'globular star cluster',
  	'intelligent beings',
  	'as a patch of light',
  	'Orion\'s sword',
  	'rings of Uranus',
  	'preserve and cherish that pale blue dot',
  	'brain is the seed of intelligence',
  	'finite but unbounded',
  	'at the edge of forever',
  	'another world',
  	'across the centuries',
  	'how far away',
  	'hundreds of thousands',
  	'shores of the cosmic ocean',
  	'encyclopaedia galactica',
  	'muse about',
  	'paroxysm of global death',
  	'dispassionate extraterrestrial observer',
  	'take root and flourish',
  	'permanence of the stars',
  	'kindling the energy hidden in matter',
  	'hearts of the stars',
  	'rich in heavy atoms',
  	'great turbulent clouds',
  	'gathered by gravity',
  	'stirred by starlight',
  	'inconspicuous motes of rock and gas',
  	'the ash of stellar alchemy',
  	'emerged into consciousness',
  	'are creatures of the cosmos',
  	'star stuff harvesting star light',
  	'descended from astronomers',
  	'dream of the mind\'s eye',
  	'vanquish the impossible',
  	'Sea of Tranquility',
  	'from which we spring',
  	'a still more glorious dawn awaits',
  	'network of wormholes',
  	'the sky calls to us',
  	'concept of the number one',
  	'not a sunrise but a galaxyrise',
  	'bits of moving fluff',
  	'something incredible is waiting to be known',
  	'the carbon in our apple pies',
  	'made in the interiors of collapsing stars',
  	'extraordinary claims require extraordinary evidence',
  	'vastness is bearable only through love',
  	'a very small stage in a vast cosmic arena',
    'invent the universe',
  	'the only home we\'ve ever known',
  	'a mote of dust suspended in a sunbeam',
  	'courage of our questions',
  	'citizens of distant epochs',
  	'with pretty stories for which there\'s little good evidence',
  	'two ghostly white figures in coveralls and helmets are soflty dancing'
  ],
  ending : ' and billions upon billions upon billions upon billions upon billions upon billions upon billions.',
  more_lorem : ['Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium',
                'totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo',
                'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit',
                'sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt',
                'Neque porro quisquam est',
                'qui dolorem ipsum quia dolor sit amet',
                'consectetur',
                'adipisci velit',
                'sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem',
                'Ut enim ad minima veniam',
                'quis nostrum exercitationem ullam corporis suscipit laboriosam',
                'nisi ut aliquid ex ea commodi consequatur',
                'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur',
                'vel illum qui dolorem eum fugiat quo voluptas nulla pariatur'],
  puncuation: ['.','.','.','?','!']
}

function rando(limit) {
  return Math.floor(Math.random()*limit);
}

function shuffle(words) {
    var o, x;
    var ix = words.length - 1;
    var rtn = [];
    while (ix) {
        o = Math.floor(Math.random() * (ix + 1));
        x = words[ix];
        rtn.push(words[o]);
        words[o] = x;
        ix--;
    }
    rtn.push(words[0]);

    return rtn;
}

function buildSentence(parts, puncuation) {
  const shuffled = shuffle(parts).slice(0,6);
  return shuffled.reduce( (accum, entry, ix) => {
        let rtn = '';
        if (ix === 0) {
          rtn = accum + entry.charAt(0).toUpperCase() + entry.slice(1);
        } else {
          rtn = accum + ' ' + entry;
        }

        if (ix === shuffled.length - 1) {
          rtn = rtn + puncuation[rando(puncuation.length - 1)];
        }

        return rtn;
    }, '');
}

let buildSentence2 = function(isLastP=true, doLatin=false) {

	const PSIZE = 32

	let wordbase = Ipsum.words.concat(Ipsum.phrases);

	if (doLatin) {
		wordbase = wordbase.concat(Ipsum.more_lorem);
	}

	let text = '';
	while ( (text.split(' ')).length < PSIZE) {
		text += buildSentence(wordbase, Ipsum.puncuation) + ' ';
	}

	if (isLastP) {
		text = text.substring(0, text.length - 2);
		text += Ipsum.ending;
	}

	return text;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// SessionID
/////////////////////////////////////////////////////////////////////////////////////////////////////////

var SessionID = function () {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// The bot
/////////////////////////////////////////////////////////////////////////////////////////////////////////

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
				message.channel.send("You're already validated")
				break
			}

			let sessionid = SessionID()
			let sagan = buildSentence2()
			let url = `https://cosmos-webapp.pages.dev/?sessionid=${sessionid}`

			database.member_add(uuid,sessionid,sagan,Date.now())

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

			//message.channel.send({ embeds: [exampleEmbed] });
			message.author.send({ embeds: [exampleEmbed] });
			break
		case "deleteme":
			database.member_delete(message.author.uuid)
			message.author.send("You've been brought back to earth")
			break
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
