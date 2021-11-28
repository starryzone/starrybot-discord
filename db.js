const myConfig = require("./auth.json");
// const myConfig = require("./auth-local.json");
// const myConfig = require("./auth-prod.json");

const knex = require('knex')({
	client: 'pg',
	connection: {
		user: myConfig.DB_USER,
		password: myConfig.DB_PASS,
		database: myConfig.DB_NAME,
		host: myConfig.DB_HOSTIP,
		port: myConfig.DB_HOSTPORT,
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
	if(knex_initialized) return
	knex_initialized = true
	try {
		const hasTable = await knex.schema.hasTable(myConfig.DB_TABLENAME_MEMBERS)
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
		const hasTable2 = await knex.schema.hasTable(myConfig.DB_TABLENAME_ROLES)
		if (!hasTable2) {
			await knex.schema.createTable(myConfig.DB_TABLENAME_ROLES, table => {
				table.increments('id').primary()
				table.string('discord_guild_id').notNullable()
				table.string('token_address').notNullable()
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

	let roles = await knex(myConfig.DB_TABLENAME_ROLES)
		.where('discord_guild_id', guildId)
		.select('discord_guild_id','token_address','has_minimum_of','created_at','created_by_discord_id','give_role')

	return roles
}

const rolesSet = async (guildId,role) => {
	await ensureDatabaseInitialized()

	let discord_guild_id = guildId;
	let token_address = "not set yet"
	let has_minimum_of = "1"
	let created_by_discord_id = "0"
	let give_role = role

	// TODO verify that this does not already exist

	let results = await knex(myConfig.DB_TABLENAME_ROLES).insert({
		discord_guild_id,
		token_address,
		has_minimum_of,
		created_by_discord_id,
		give_role
	})
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

module.exports = { membersAll, memberExists, memberBySessionToken, memberByIdAndGuild, memberAdd, memberDelete, myConfig, rolesGet, rolesSet, rolesDelete }
