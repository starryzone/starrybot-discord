const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { Bech32 } = require("@cosmjs/encoding");
const fetch = require("node-fetch");

// See getNetworkInfo where this is taken from env vars
let networkInfo, networkPrefixes;
try {
  networkInfo = JSON.parse(process.env.COSMOS_NETWORKS)
  networkPrefixes = Object.keys(networkInfo)
} catch (e) {
  console.error('Cannot parse COSMOS_NETWORKS environment variable, please ensure that it is set.')
}

function getPrefixFromToken(tokenAddress) {
  let ret;
  const decodedAccount = Bech32.decode(tokenAddress);
  if (decodedAccount && decodedAccount.prefix) {
    ret = decodedAccount.prefix
  } else {
    ret = false
  }
  return ret
}

// Note that this function throws, so please call it in a try/catch
/*
 * tokenAddress — e.g. "juno1w2sr3vz0xg9kj82kumd7j7a5736wfklqtnctx0frdj26kclctleqvzx2ly"
 */
function getConnectionFromToken(tokenAddress, connType, network) {
    const prefix = getPrefixFromToken(tokenAddress)
    if (networkPrefixes.includes(prefix)) {
      return getConnectionFromPrefix(prefix, connType, network)
    } else {
      throw 'Could not find prefix'
    }
}

// Note that this function throws, so please call it in a try/catch
/*
 * prefix — e.g. "stars"
 * connType — "lcd" | "rpc"
 * network — "mainnet"
 */
function getConnectionFromPrefix(prefix, connType, network) {
  if (!networkInfo.hasOwnProperty(prefix)) throw 'Do not know about that network prefix'
  return networkInfo[prefix][connType][network]
}

const checkRPCStatus = async (networkUrl) => {
  const cosmClient = await CosmWasmClient.connect(networkUrl);
  // Try getting the height
  await cosmClient.getHeight()
}

const checkLCDStatus = async (lcdUrl) => {
  const delegationRes = await fetch(`${lcdUrl}/staking/pool`)
  const body = await delegationRes.json();
  // Ensure it at least is returning height
  if (!body.hasOwnProperty('height')) throw 'Did not return height as expected'
}

module.exports = {
  checkRPCStatus,
  checkLCDStatus,
  getPrefixFromToken,
  getConnectionFromToken,
  getConnectionFromPrefix,
  networkInfo,
  networkPrefixes
}
