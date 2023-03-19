'use strict';

const db = require("./db")
const logger = require("./logger")
const Sagan = require("./sagan.js")

const { serializeSignDoc } = require('@cosmjs/amino')
const { Secp256k1, Secp256k1Signature, sha256 } = require('@cosmjs/crypto')
const { fromBase64, Bech32} = require('@cosmjs/encoding')
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { getTokenBalance, getStakedTokenBalance } = require("./astrolabe");
const {sumDelegationsForAccount} = require("./utils/tokens");
const {Bech32Address} = require('@keplr-wallet/cosmos');
const {PubKeySecp256k1} = require('@keplr-wallet/crypto');

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
const isValidSignature = async (signed, signature, publicKey, address) => {
  let valid = false;
  try {
    let binaryHashSigned = sha256(serializeSignDoc(signed));
    let binaryPublicKey = new Uint8Array(Object.values(publicKey));

    const cryptoPubKey = new PubKeySecp256k1(binaryPublicKey);
    const expectedAddress = new Bech32Address(cryptoPubKey.getAddress()).toBech32(
      'cosmos',
    );
    if (expectedAddress != address) {
      return false;
    }

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

async function tokenRuleInfo(body, client) {
	const { discordUserId, guildId } = body
  // Add/remove roles as necessary
  const cosmosHubAddress = await db.getCosmosHubAddress({guildId, discordUserId})
  console.log(`Guild ${guildId} has user ${discordUserId} whose Cosmos Hub address is ${cosmosHubAddress}`);
  // Some folks who used starrybot early on didn't have their Cosmos address captured
  if (!cosmosHubAddress) {
    return { error: 'User must use "/starry login" to capture Cosmos Hub address'}
  }
  const addedRemovedRoleNames = await addRemoveRoles(discordUserId, guildId, cosmosHubAddress, client)
  console.log('Added/removed role names', addedRemovedRoleNames)
  if (addedRemovedRoleNames.error) {
    return addedRemovedRoleNames
  }
  return { success: addedRemovedRoleNames }
}

async function addRemoveRoles(discordUserId, discordGuildId, cosmosAddress, client) {
  let ret = {
    'added': [],
    'removed': []
  }
  // get all possible roles
  let roles = await db.rolesGet(discordGuildId)
  if (!roles || !roles.length) {
    return { error: "Admin needs to setup roles to give out"}
  }

  // get guild
  const guild = await client.guilds.fetch(discordGuildId)
  if (!guild) {
    logger.error("discord::hoist - cannot find guild");
    return { error: "cannot find guild"}
  }

  // get user
  const author = await client.users.fetch(discordUserId)
  if (!author) {
    logger.error("discord::hoist - cannot find participant")
    return { error: "cannot find party"}
  }

  for (let role of roles) {
    let roleName = role.give_role
    let roleDiscord = guild.roles.cache.find(r => r.name === roleName)
    const network = role.network;
    const tokenAddress = role.token_address
    const countStakedOnly = role.count_staked_only

    let balance;
    try {
      if (countStakedOnly) {
        balance = await getStakedTokenBalance({keplrAccount: cosmosAddress, tokenAddress, network, extra: { staking_contract: role.staking_contract }});
      } else {
        balance = await getTokenBalance({keplrAccount: cosmosAddress, tokenAddress, network, extra: { staking_contract: role.staking_contract }});
      }
    } catch(e) {
      console.warn(e);
      // even if this role fails, see if we can add any others
      continue;
    }

    // Only proceed if the balance is greater than the minimum
    console.log(`Comparing ${balance} against ${parseInt(role.has_minimum_of)}`);
    const member = await guild.members.fetch(discordUserId)
    const discordRole = guild.roles.cache.find(r => r.name === roleName)
    if (balance < parseInt(role.has_minimum_of)) {
      // Remove role if the have it, since they should no longer have it
      if (discordRole && member.roles.cache.has(discordRole.id)) {
        await member.roles.remove(discordRole.id)
        ret.removed.push(roleName)
      }
      continue
    }

    // At this point, we're sure the user has given the role
    if (!roleDiscord) {
      logger.error('Could not find role', { data: {
        roleName
      }})
    } else {
      if (discordRole && !member.roles.cache.has(discordRole.id)) {
        logger.log(`Adding user ${author.id} to role ${roleName}`)
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        try {
          await rest.put(
            Routes.guildMemberRole(guild.id, author.id, roleDiscord.id)
          );
          ret.added.push(roleName)
        } catch (e) {
          logger.error(`Error trying to add role. Guild: ${guild.id}, User: ${author.id}`, e)
          return;
        }
      } else {
        console.log(`User already has role ${roleName}`)
      }
    }
  }
  return ret
}

// Finalize hoist
async function hoistFinalize(blob, client) {
  const { traveller, signed, signature, account } = blob;
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

  // is signature valid?
  const validSignature = await isValidSignature(signed, signature, publicKey, account.address);
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
  // Add the user's Cosmos Hub address to database
  // Convert to Cosmos Hub address
  let cosmosHubAddress = Bech32.encode('cosmos', Bech32.decode(account.address).data)
  await db.addCosmosHubAddress(member.discord_guild_id, member.discord_account_id, cosmosHubAddress)

  // Add/remove roles as necessary
  const addedRemovedRoleNames = await addRemoveRoles(member.discord_account_id, member.discord_guild_id, cosmosHubAddress, client)

  return { success: addedRemovedRoleNames }
}

module.exports = { hoistRequest, hoistInquire, hoistDrop, hoistFinalize, tokenRuleInfo, addRemoveRoles }
