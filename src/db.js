// Initialize process.env with variables set in .env
require('dotenv').config({ path:__dirname+'/../.env' });

const logger = require("./logger")

// const defaultConfig = require("./auth-local.json");
// const defaultConfig = require("./auth-prod.json");
const myConfig = {
	"DISCORD_TOKEN": process.env.DISCORD_TOKEN,
	"PREFIX": process.env.PREFIX,
	"DB_HOSTIP": process.env.DB_HOSTIP,
	"DB_OUTGOINGIP": process.env.DB_OUTGOINGIP,
	"DB_HOSTPORT": process.env.DB_HOSTPORT,
	"DB_PASS": process.env.DB_PASS,
	"DB_USER": process.env.DB_USER,
	"DB_NAME": process.env.DB_NAME,
	"DB_TABLENAME": process.env.DB_TABLENAME,
	"DB_TABLENAME_MEMBERS": process.env.DB_TABLENAME_MEMBERS,
	"DB_TABLENAME_ROLES": process.env.DB_TABLENAME_ROLES,
	"DB_TABLENAME_SYNC": process.env.DB_TABLENAME_SYNC,
	"DB_SOCKET_PATH": process.env.DB_SOCKET_PATH,
	"INSTANCE_CONNECTION_NAME": process.env.INSTANCE_CONNECTION_NAME,
	"DB_KEY": process.env.DB_KEY,
	"DB_CERT": process.env.DB_CERT,
	"DB_ROOT_CERT": process.env.DB_ROOT_CERT,
	"WINSTON": process.env.WINSTON,
	"PORT": process.env.PORT,
	"VALIDATOR": process.env.VALIDATOR
}

const enableSSL = !['localhost', '127.0.0.1'].includes(myConfig.DB_HOSTIP);

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

// When a discord user visits a discord area or "guild" the starrybot can grant them some special roles on demand.
// Typically, these magical roles (and any preconditions required to be knighted with these roles) are defined by an admin.
// These roles, and the preconditions, are stored here.
// Supply a discord_guild_id to find associated roles if any
const rolesGet = async (guildId) => {
	await ensureDatabaseInitialized()

	const roles = await knex(myConfig.DB_TABLENAME_ROLES)
		.where('discord_guild_id', guildId)
		.select('discord_guild_id','token_address','has_minimum_of','created_at','created_by_discord_id','give_role', 'network', 'token_type', 'decimals', 'staking_contract', 'count_staked_only')

	return roles
}

const roleGet = async (guildId, roleName) => {
	await ensureDatabaseInitialized()

	const role = await knex(myConfig.DB_TABLENAME_ROLES)
	.where({
		'discord_guild_id': guildId,
		'give_role': roleName,
	})
	.select('discord_guild_id','token_address','has_minimum_of','created_at','created_by_discord_id','give_role', 'network', 'token_type', 'decimals', 'staking_contract', 'count_staked_only')

	return role[0];
}

const rolesGetForCleanUp = async (guildId) => {
	await ensureDatabaseInitialized()
	const roles = await knex(myConfig.DB_TABLENAME_ROLES)
		.where({'discord_guild_id': guildId, 'remove_in_cleanup': true})
		.select('give_role')

	return roles
}

const rolesSet = async (guildId, role, tokenType, tokenAddress, network, removeInCleanup, createdByDiscordId, hasMinimumOf, decimals, stakingContract, countStakedOnly) => {
	await ensureDatabaseInitialized()

	let discord_guild_id = guildId;
	let give_role = role
	let token_type = tokenType
	let token_address = tokenAddress
	let created_by_discord_id = createdByDiscordId
	let has_minimum_of = hasMinimumOf
	let count_staked_only = countStakedOnly
	const staking_contract = stakingContract

	// If this role for this guild already exists, return
	let existingRows = await knex(myConfig.DB_TABLENAME_ROLES).where({
		discord_guild_id,
		give_role
	}).select('id')
	let results
	if (existingRows.length) {
		results = await knex(myConfig.DB_TABLENAME_ROLES).update({
			discord_guild_id,
			decimals,
			token_address,
			token_type,
			has_minimum_of,
			created_by_discord_id,
			give_role,
			network,
			remove_in_cleanup: removeInCleanup,
			staking_contract,
			count_staked_only
		}).where('id', existingRows[0].id)
	} else {
		results = await knex(myConfig.DB_TABLENAME_ROLES).insert({
			discord_guild_id,
			decimals,
			token_address,
			token_type,
			has_minimum_of,
			created_by_discord_id,
			give_role,
			network,
			remove_in_cleanup: removeInCleanup,
			staking_contract,
			count_staked_only
		})
	}
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

// SessionID
// Math.random should be unique because of its seeding algorithm.
// Convert it to base 36 (numbers + letters), and grab the first 9 characters
// after the decimal.
const SessionID = function () {
	return Math.random().toString(36).substr(2, 9);
};

// database wrapper - for members

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

const syncDetails = async(guildId) => {
	await ensureDatabaseInitialized()
	let res = await knex(myConfig.DB_TABLENAME_SYNC)
		.where('discord_guild_id', guildId)
		.select()
	return res
}

const inferPreferredNativeToken = async (guildId) => {
	await ensureDatabaseInitialized()
	let nativeTokens = await knex(myConfig.DB_TABLENAME_ROLES)
		.where('discord_guild_id', guildId)
		.andWhere('token_type', 'native')
		.select('token_address' )
		.orderBy('created_at', 'desc')
	return (nativeTokens && nativeTokens.length) ? nativeTokens[0]['token_address'] : false
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

const nativeTokensFromGuild = async({guildId}) => {
	await ensureDatabaseInitialized()
	let tokenTypes = await knex(myConfig.DB_TABLENAME_ROLES)
		.where(
		'token_type', 'like', '%native%')
		.andWhere('discord_guild_id', guildId)
		.select('token_address', 'has_minimum_of', 'give_role')

	return tokenTypes
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

const addCosmosHubAddress = async (guildId, discordAccountId, cosmosHubAddress) => {
	await knex(myConfig.DB_TABLENAME_MEMBERS)
		.where({
			'discord_guild_id': guildId,
			'discord_account_id': discordAccountId
		})
		.update('cosmos_address', cosmosHubAddress)
}

const getCosmosHubAddressFromDiscordId = async ({discordUserId}) => {
	await ensureDatabaseInitialized()
	let cosmosHubAddress = await knex(myConfig.DB_TABLENAME_MEMBERS)
		.where('discord_account_id', discordUserId)
		.distinct('cosmos_address')
	return cosmosHubAddress[0].cosmos_address
}

module.exports = { membersAll, memberExists, memberBySessionToken, memberByIdAndGuild, memberAdd, memberDelete, myConfig, rolesGet, roleGet, rolesSet, rolesDelete, rolesDeleteGuildAll, rolesGetForCleanUp, inferPreferredNativeToken, addCosmosHubAddress, nativeTokensFromGuild, getCosmosHubAddressFromDiscordId, syncDetails }
