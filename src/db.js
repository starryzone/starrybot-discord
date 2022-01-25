const logger = require("./logger")
const myConfig = require("./config.json");

// const defaultConfig = require("./auth-local.json");
// const defaultConfig = require("./auth-prod.json");

Object.keys(myConfig).forEach(key=>{
	let value = process.env[key]
	if(process[value]) { //process.env.hasOwnProperty(key)) {
		myConfig[key] = value
	} else {
		//let value = defaultConfig[key]
		//if(value) myConfig[key]=value
	}
})

/*
const myConfigUnused = {
	"DISCORD_TOKEN": process.env.DISCORD_TOKEN | "set-discord-token",
	"PREFIX": process.env.PREFIX || defaultConfig.PREFIX || "!",
	"DB_HOSTIP": process.env.DB_HOSTIP || defaultConfig.DB_HOSTIP || "127.0.0.1",
	"DB_OUTGOINGIP": process.env.DB_OUTGOINGIP || defaultConfig.DB_OUTGOINGIP || "",
	"DB_HOSTPORT": process.env.DB_HOSTPORT || defaultConfig.DB_HOSTPORT || 5432,
	"DB_PASS": process.env.DB_PASS || defaultConfig.DB_PASS || "set DB_PASS env var",
	"DB_USER": process.env.DB_USER || defaultConfig.DB_USER || "mike",
	"DB_NAME": process.env.DB_NAME || defaultConfig.DB_NAME || "starrydata",
	"DB_TABLENAME": process.env.DB_TABLENAME || defaultConfig.DB_TABLENAME || "starryfacts",
	"DB_TABLENAME_MEMBERS": process.env.DB_TABLENAME_MEMBERS || defaultConfig.DB_TABLENAME_MEMBERS || "starry_members",
	"DB_TABLENAME_ROLES": process.env.DB_TABLENAME_ROLES || defaultConfig.DB_TABLENAME_ROLES || "starry_roles",
	"DB_SOCKET_PATH": process.env.DB_SOCKET_PATH || defaultConfig.DB_SOCKET_PATH || "",
	"INSTANCE_CONNECTION_NAME": process.env.INSTANCE_CONNECTION_NAME || defaultConfig.INSTANCE_CONNECTION_NAME || "",
	"DB_KEY": process.env.DB_KEY || defaultConfig.DB_KEY || "",
	"DB_CERT": process.env.DB_CERT || defaultConfig.DB_CERT || "",
	"DB_ROOT_CERT": process.env.DB_ROOT_CERT || defaultConfig.DB_ROOT_CERT || "",
	"WINSTON": process.env.WINSTON || defaultConfig.WINSTON || false,
	"PORT": process.env.PORT || defaultConfig.PORT || 8080,
	"VALIDATOR": process.env.VALIDATOR || defaultConfig.VALIDATOR || 'https://verify.starrybot.xyz/'
}*/

const enableSSL = myConfig.DB_HOSTIP !== 'localhost';

const knex = require('knex')({
	client: 'pg',
	connection: {
		user: myConfig.DB_USER,
		password: myConfig.DB_PASS,
		database: myConfig.DB_NAME,
		host: myConfig.DB_HOSTIP,
		port: myConfig.DB_HOSTPORT,
		ssl: enableSSL
	},
	pool: {
		max: 5,
		min: 5,
		acquireTimeoutMillis: 60000,
		createTimeoutMillis: 30000,
		idleTimeoutMillis: 600000,
		createRetryIntervalMillis: 200,
	}
});

let knex_initialized = false

const ensureDatabaseInitialized = async () => {
	if (knex_initialized) return
	knex_initialized = true
	try {
		// Reminder: we have database migrations in the "migrations" directory at the project root
		let hasTable = await knex.schema.hasTable(myConfig.DB_TABLENAME_MEMBERS)
		if (!hasTable) {
			await knex.schema.createTable(myConfig.DB_TABLENAME_MEMBERS, table => {
				table.increments('id').primary()
				table.string('discord_account_id').notNullable()
				table.string('discord_guild_id').notNullable()
				table.timestamp('created_at').defaultTo(knex.fn.now())
				table.string('session_token').notNullable()
				table.text('saganism', 'mediumtext').notNullable()
				table.boolean('is_member')
			})
		}
		hasTable = await knex.schema.hasTable(myConfig.DB_TABLENAME_ROLES)
		if (!hasTable) {
			await knex.schema.createTable(myConfig.DB_TABLENAME_ROLES, table => {
				table.increments('id').primary()
				table.string('discord_guild_id').notNullable()
				table.string('discord_role_id').notNullable()
				table.string('token_address').notNullable()
				table.string('token_type').notNullable()
				table.string('has_minimum_of').notNullable()
				table.timestamp('created_at').defaultTo(knex.fn.now())
				table.string('created_by_discord_id').notNullable()
				table.string('give_role').notNullable()
			})
		}
	} catch(err) {
		logger.error(err);
		throw err;
	}
}

///
/// When a discord user visits a discord area or "guild" the starrybot can grant them some special roles on demand.
///
/// Typically these magical roles (and any preconditions required to be knighted with these roles) are defined by an admin.
///
/// These roles, and the preconditions, are stored here.
///
/// Supply a discord_guild_id to find associated roles if any
///

const rolesGet = async (guildId) => {

	await ensureDatabaseInitialized()

	const roles = await knex(myConfig.DB_TABLENAME_ROLES)
		.where('discord_guild_id', guildId)
		.select('discord_guild_id','discord_role_id','token_address','has_minimum_of','created_at','created_by_discord_id','give_role')

	return roles
}

const rolesSet = async (guildId, roleId, role, tokenType, tokenAddress, network, removeInCleanup) => {
	await ensureDatabaseInitialized()

	let discord_guild_id = guildId;
	let discord_role_id = roleId
	let token_address = tokenAddress
	let token_type = tokenType
	let has_minimum_of = "1"
	let created_by_discord_id = "0"
	let give_role = role

	// If this role for this guild already exists, return
	let existingRows = await knex(myConfig.DB_TABLENAME_ROLES).where({
		discord_guild_id,
		give_role
	}).select('id')
	if (existingRows.length) return

	let results = await knex(myConfig.DB_TABLENAME_ROLES).insert({
		discord_guild_id,
		discord_role_id,
		token_address,
		token_type,
		has_minimum_of,
		created_by_discord_id,
		give_role,
		network,
		remove_in_cleanup: removeInCleanup
	})
	console.log('results', results)
}

const rolesDelete = async (guildId,role) => {

 	await ensureDatabaseInitialized()
	try {
		await knex(myConfig.DB_TABLENAME_ROLES).where( { discord_guild_id: guildId, give_role: role })
			.del()
	} catch (e) {
		console.warn('Error deleting row', e)
	}

}

const rolesDeleteGuildAll = async (guildId) => {

 	await ensureDatabaseInitialized()
	try {
		await knex(myConfig.DB_TABLENAME_ROLES).where( { discord_guild_id: guildId })
			.del()
	} catch (e) {
		console.warn('Error deleting row', e)
	}

}

///
/// SessionID
/// Math.random should be unique because of its seeding algorithm.
/// Convert it to base 36 (numbers + letters), and grab the first 9 characters
/// after the decimal.
///

const SessionID = function () {
	return Math.random().toString(36).substr(2, 9);
};


///
/// database wrapper - for members
///

const membersAll = async (guildId) => {
	await ensureDatabaseInitialized()
	return knex(myConfig.DB_TABLENAME_MEMBERS).where({
		discord_guild_id: guildId
	}).select('id','created_at','discord_account_id','session_token')
}

const memberExists = async (uuid, guildId) => {
	await ensureDatabaseInitialized()
	return knex(myConfig.DB_TABLENAME_MEMBERS).where({
		discord_account_id: uuid,
		discord_guild_id: guildId
	}).select('id')
}

const memberBySessionToken = async (session_token) => {
	await ensureDatabaseInitialized()
	let members = await knex(myConfig.DB_TABLENAME_MEMBERS)
		.where('session_token', session_token)
		.select('created_at', 'saganism','discord_account_id','discord_guild_id','is_member')
	return (members && members.length) ? members[0] : 0
}

const memberByIdAndGuild = async ({authorId, guildId}) => {
	await ensureDatabaseInitialized()
	let members = await knex(myConfig.DB_TABLENAME_MEMBERS).where({
		discord_account_id: authorId,
		discord_guild_id: guildId
	}).select('is_member')
	return (members && members.length) ? members[0] : 0
}

const memberAdd = async ({discord_account_id, discord_guild_id, saganism}) => {
	await ensureDatabaseInitialized()
	let session_token = SessionID()
	await knex(myConfig.DB_TABLENAME_MEMBERS).insert({
		discord_account_id,
		discord_guild_id,
		saganism,
		session_token
	})
	return session_token
}

const memberDelete = async ({authorId, guildId}) => {
	await ensureDatabaseInitialized()
	try {
		await knex(myConfig.DB_TABLENAME_MEMBERS).where('discord_account_id', authorId)
			.andWhere('discord_guild_id', guildId).del()
	} catch (e) {
		console.warn('Error deleting row', e)
	}
}

module.exports = { membersAll, memberExists, memberBySessionToken, memberByIdAndGuild, memberAdd, memberDelete, myConfig, rolesGet, rolesSet, rolesDelete, rolesDeleteGuildAll }
