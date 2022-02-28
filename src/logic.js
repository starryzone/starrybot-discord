'use strict';

const { networkInfo, networkPrefixes, getConnectionFromPrefix, getConnectionFromToken, getPrefixFromToken } = require("./astrolabe/networks")
const db = require("./db")
const logger = require("./logger")
const Sagan = require("./sagan.js")
const fetch = require("node-fetch");

const { serializeSignDoc } = require('@cosmjs/amino')
const { Secp256k1, Secp256k1Signature, sha256 } = require('@cosmjs/crypto')
const { fromBase64, Bech32 } = require('@cosmjs/encoding')
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { StargateClient } = require("@cosmjs/stargate");

// Returns a block with { memberId, saganism }
// or on error either throws an error or returns { error }
async function hoistRequest(args) {
	logger.log("hoistRequest");
	logger.log(args)

	let authorId = args.authorId
	let guildId = args.guildId

	// has user already been given a role? TODO refine
	const member = await db.memberByIdAndGuild({authorId,guildId})
	if (member && member.is_member) {
		return {error:"You already have privileges on this server"}
	}

	// hit me sagan
	let saganism = Sagan.sagan()

	// create a member record
	let traveller = await db.memberAdd({
		discord_account_id: authorId,
		discord_guild_id: guildId,
		saganism: saganism
	})

	// return a nice useful blob to the caller so they can print some stuff out
	return {traveller , saganism }
}

// Allow a remote caller to inquire about a member
async function hoistInquire(traveller) {
	let ret
	// If they didn't send the proper parameter
	if (!traveller) {
		throw "No traveller sent"
	}

	let member = await db.memberBySessionToken(traveller)
	if (!member) {
		throw "No record found"
	}

	const createdAt = member.created_at

	// TODO: see if they've surpassed their allotted time to respond

	const saganism = member.saganism

	ret = { saganism, createdAt }
	// See if we can determine a preferred native token, informing which
	// chain ID the frontend should try to connect
	const preferredPrefix = await db.inferPreferredNativeToken(member.discord_guild_id)
	if (preferredPrefix) {
		ret.nativeToken = preferredPrefix
	}

	return ret
}

// And drop a user
async function hoistDrop(args) {
	logger.log("hoistDrop")
	logger.log(args)
	let authorId = args.authorId
	let guildId = args.guildId
	await db.memberDelete({authorId,guildId})
	return { message:"You've been removed" }
	// TODO actually remove users
}

// Signing
// Returns boolean whether the signature is valid or not
const isValidSignature = async (signed, signature, publicKey) => {
	let valid = false;
	try {
		let binaryHashSigned = sha256(serializeSignDoc(signed));
		let binaryPublicKey = new Uint8Array(Object.values(publicKey));

		valid = await Secp256k1.verifySignature(
			Secp256k1Signature.fromFixedLength(fromBase64(signature)),
			binaryHashSigned,
			binaryPublicKey,
		);
	} catch (e) {
		logger.error('Issue trying to verify the signature', e);
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
		let member = await db.memberBySessionToken(traveller)
		if (!member) {
			// Don't even have a row for this ID - sad
			return false;
		}
		// What they should have signed
		const assignedSaganism = member.saganism;
		isCorrect = signedSaganism === assignedSaganism;
	} catch (e) {
		logger.error('Issue determining if the user signed the right thing', e);
	} finally {
		return isCorrect;
	}
}

async function sumDelegationsForAccount(address) {
	const lcdUrl = getConnectionFromToken(address, 'lcd', 'mainnet')
	const delegationRes = await fetch(`${lcdUrl}/staking/delegators/${address}/delegations`)
	const body = await delegationRes.json();
	const sum = body.result.reduce(
		(prevVal, currentVal) => prevVal + parseInt(currentVal.balance.amount),
		0
	);

	console.log('Sum of delegations', sum)
	return sum
}

async function sumUnbondingDelegationsForAccount(address) {
	const lcdUrl = getConnectionFromToken(address, 'lcd', 'mainnet')
	const unbondingRes = await fetch(`${lcdUrl}/staking/delegators/${address}/unbonding_delegations`)
	const body = await unbondingRes.json();

	const sum = body.result.reduce((prevVal, currentVal) => {
		const innerSum = currentVal.entries.reduce((innerPrevVal, innerCurrentVal) => {
			return innerPrevVal + parseInt(innerCurrentVal.balance);
		}, 0);
		return prevVal + innerSum;
	}, 0);

	console.log('Sum of delegations currently unbonding', sum)
	return sum
}

// Finalize hoist
async function hoistFinalize(blob, client) {
	const {traveller, signed, signature, account} = blob;
	const publicKey = account.pubkey

	// get member
	let member = await db.memberBySessionToken(traveller)

	if (!member) {
		logger.error("discord::hoist - no member")
		return {error:"Member not found"}
	}

	if (!member.discord_guild_id || !member.discord_account_id) {
		logger.error("discord::hoist - incomplete params")
		return {error:"incomplete params"}
	}

	const createdAt = member.created_at;
	// TODO: see if they've surpassed their allotted time to respond ...
	const saganism = member.saganism;

	// already validated?
	if (member.is_member) {
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

	logger.log("*** user has passed all tests *** ")

	// get all possible roles
	let roles = await db.rolesGet(member.discord_guild_id)
	if (!roles || !roles.length) {
		return { error: "Admin needs to setup roles to give out"}
	}

	// get guild
	const guild = await client.guilds.fetch(member.discord_guild_id)
	if (!guild) {
		logger.error("discord::hoist - cannot find guild");
		return { error: "cannot find guild"}
	}

	// get user
	const author = await client.users.fetch(member.discord_account_id)
	if (!author) {
		logger.error("discord::hoist - cannot find participant")
		return { error: "cannot find party"}
	}
	console.log('author', author)

	//
	// Add a role to user
	//
	// Notes:
	// https://discordjs.guide/popular-topics/faq.html#how-do-i-unban-a-user
	// const role = interaction.options.getRole('role');
	// const member = interaction.options.getMember('target');
	// member.roles.add(role);
	//

	for (let role of roles) {
		const keplrAccount = account.address;

		let roleName = role.give_role
		let roleDiscord = guild.roles.cache.find(r => r.name === roleName)
		const tokenType = role.token_type
		const network = role.network;
		const tokenAddress = role.token_address

		let rpcEndpoint, rpcClient;
		// The token address is either going to be a prefix "juno"
		// or an address with the prefix "juno123abc…"

		if (networkPrefixes.includes(tokenAddress)) {
			// This is a native token starrybot supports
			try {
				rpcEndpoint = await getConnectionFromPrefix(tokenAddress, 'rpc', network)
			} catch (e) {
				console.error(`Error with native token ${tokenAddress}`, e)
				continue
			}
		} else {
			// A cw20 address
			try {
				rpcEndpoint = await getConnectionFromToken(tokenAddress, 'rpc', network)
			} catch (e) {
				console.error(`Error with fungible token ${tokenAddress}`, e)
				continue
			}
		}
		if (!rpcEndpoint) {
			console.error('Issue getting RPC endpoint for', tokenAddress)
			return
		}

		rpcClient = await StargateClient.connect(rpcEndpoint)
		let decodedAccount = Bech32.decode(keplrAccount).data;
		let encodedAccount, matches;

		// We have an entire address instead of 'juno' or 'stars' prefixes
		if (tokenType === 'cw20') {
			const prefix = getPrefixFromToken(tokenAddress);
			// Unlikely, but if something has gone wrong, continue
			if (!prefix) {
				console.error('Could not determine prefix')
				continue
			}

			encodedAccount = Bech32.encode(prefix, decodedAccount);
			let smartContract;
			try {
				// Attempt to connect in a try catch, as it's possible for testnet to be down
				const rpcEndpoint = getConnectionFromPrefix(prefix, 'rpc', network)
				const cosmClient = await CosmWasmClient.connect(rpcEndpoint)

					smartContract = await cosmClient.queryContractSmart(tokenAddress, {
						balance: {
							address: encodedAccount,
						}
					});
			} catch (e) {
				console.warn(e);
				// even if this role fails, see if we can add any others
				continue;
			}
			console.log('cw20 holding info', smartContract)
			matches = [{
				amount: smartContract.balance
			}]
		} else if (rpcClient) {
			// Token type is native, so the token address is expected to be a prefix
			encodedAccount = Bech32.encode(tokenAddress, decodedAccount);
			let balances;
			try {
				balances = await rpcClient.getAllBalances(encodedAccount);
				console.log(`balances ${tokenAddress}`, balances)
				matches = balances.filter(balances => balances.denom === `u${tokenAddress}`)

				// A user can potentially have no liquid stars, account for that
				if (matches.length === 0) {
					matches = [{
						amount: 0
					}]
				}
				console.log('Liquid native tokens', matches[0].amount)

				// Now check for delegation amounts if mainnet
				if (network === 'mainnet') {
					const delegationTotal = await sumDelegationsForAccount(encodedAccount)
					matches[0].amount = parseInt(matches[0].amount) + delegationTotal
					console.log('Sum of liquid and staked', matches[0].amount)
					const unbondingDelegationTotal = await sumUnbondingDelegationsForAccount(encodedAccount)
					matches[0].amount = parseInt(matches[0].amount) + unbondingDelegationTotal
					console.log('Sum of liquid and staked and unbonding', matches[0].amount)
				}
			} catch (e) {
				console.warn(e);
				// Even if this role fails, see if we can add any others
				continue;
			}
		} else {
			// We don't know what to do, just skip
			console.warn("No client was ever created to check");
			continue;
		}

		// If they have no balance or zero balance, continue the loop through roles
		if (matches.length !== 1 || !Number.isInteger(parseInt(matches[0].amount))) {
			console.log("no matches found");
			continue
		} else if (parseInt(matches[0].amount) < parseInt(role.has_minimum_of)) {
			// If they don't have enough, don't add it either
			console.log("not enough to get the role");
			continue
		}
		console.log(`${parseInt(matches[0].amount)} is greater than ${parseInt(role.has_minimum_of)}`)

		// At this point, we can be sure the user should be given the role
		const systemChannelId = guild.systemChannelId;
		let systemChannel = await client.channels.fetch(systemChannelId);
		if (!roleDiscord) {
			systemChannel.send("Hmm, starrybot cannot find role " + roleName)
		} else {
			logger.log("Adding user to role " + roleName)
			const rest = new REST().setToken(process.env.DISCORD_TOKEN);
			try {
				await rest.put(
					Routes.guildMemberRole(guild.id, author.id, roleDiscord.id)
				);
			} catch (e) {
				console.error('Error trying to add role', e)
				systemChannel.send("starrybot was unable to give someone their role :(\nPlease make sure my permission is higher in the list than " + roleDiscord.name);
				return;
			}

			// TODO must ALSO set is_member in database
			// TODO: make sure we remove this row
		}
	}

	return { success:"done" }
}

module.exports = { hoistRequest, hoistInquire, hoistDrop, hoistFinalize }
