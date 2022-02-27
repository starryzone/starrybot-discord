const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromToken } = require('../utils/networks')
const { checkForCW20 } = require('./cw20');

const isDaoDaoAddress = daodaoUrl => {
  const daodaoRegex = /^https:\/\/(testnet\.)?daodao.zone/;
  return daodaoUrl.match(daodaoRegex);
}

const getDAOAddressFromDAODAOUrl = daoDAOUrl => {
  const daoAddressRegex = /^https:\/\/(testnet\.)?daodao.zone\/dao\/(\w*)/;
  const regexMatches = daoAddressRegex.exec(daoDAOUrl);
  // [0] is the string itself, [1] is the (testnet\.) capture group, [2] is the (\w*) capture group
  return regexMatches[2];
}

const checkForDAODAODAO = async (cosmClient, daoDAOUrl, gracefulExit) => {
  let daoInfo
  try {
    const daoAddress = getDAOAddressFromDAODAOUrl(daoDAOUrl)
    daoInfo = await cosmClient.queryContractSmart(daoAddress, {
      get_config: { },
    })
    console.log('daoInfo', daoInfo)
  } catch (e) {
    let chainId;
    try {
      // It's possible for this to also fail, but we still want to know what went wrong
      chainId = await cosmClient.getChainId();
    }  catch (e) {
      chainId = '[chain ID not found]'
    }
    console.error(`Error message after trying to query daodao dao on ${chainId}`, e.message)
    // TODO: reduce copy pasta
    if (e.message.includes('decoding bech32 failed')) {
      throw 'Invalid address. Remember: first you copy, then you paste.';
    } else if (e.message.includes('contract: not found')) {
      if (gracefulExit) return false
      throw 'No contract at that address. Probable black hole.';
    } else if (e.message.includes('Error parsing into type')) {
      if (gracefulExit) return false
      throw 'That is a valid contract, but cosmic perturbations tell us it is not a cw20.';
    }
  }
  return daoInfo
}

const getDaoDaoTokenDetails = async (daodaoUrl) => {
  if (!isDaoDaoAddress(daodaoUrl)) return;

  const network = daodaoUrl.includes('testnet') ? 'testnet' : 'mainnet';

  // Let's determine the RPC to connect to
  // based on the dao address
  const daoAddress = getDAOAddressFromDAODAOUrl(daodaoUrl)
  const rpcEndpoint = getConnectionFromToken(daoAddress, 'rpc', network)
  const cosmClient = await CosmWasmClient.connect(rpcEndpoint)
  // Exit a failed state more gracefully on mainnet
  const gracefulExit = network === 'mainnet';
  const daoInfo = await checkForDAODAODAO(cosmClient, daodaoUrl, gracefulExit);
  // If there isn't a governance token associated with this DAO, fail with message
  if (!daoInfo || !daoInfo.hasOwnProperty('gov_token')) {
    // This will be caught in our own catch below
    throw "We couldn't find any governance token associated with your DAO :/\nPerhaps destroyed in a supernova?";
  }
  const cw20Input = daoInfo['gov_token']
  // Now that we have the cw20 token address and network, get the info we want
  const tokenInfo = await checkForCW20(cosmClient, cw20Input, false)

  return {
    network,
    cw20Input,
    tokenType: 'cw20',
    tokenInfo,
  };
}

module.exports = {
  getDAOAddressFromDAODAOUrl,
  getDaoDaoTokenDetails,
  checkForDAODAODAO,
  
  daodao: {},
}
