
const myconfig = require("./auth.json");

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

let pool = 0

const createPoolAndEnsureSchema = async () => {
	if(pool) return pool
	try {
		pool = await createPool()
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
