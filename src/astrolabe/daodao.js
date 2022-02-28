const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromToken } = require('./networks')
const { checkForCW20 } = require('./cw20');

// Check to see if they pasted a DAODAO URL like this:
// https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld
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

const checkForDAODAODAO = async (cosmClient, daoDAOUrl) => {
  const daoAddress = getDAOAddressFromDAODAOUrl(daoDAOUrl)
  return cosmClient.queryContractSmart(daoAddress, {
    get_config: { },
  })
}

const getDaoDaoTokenDetails = async (daodaoUrl) => {
  if (!isDaoDaoAddress(daodaoUrl)) return;

  const network = daodaoUrl.includes('testnet') ? 'testnet' : 'mainnet';

  // Let's determine the RPC to connect to
  // based on the dao address
  const daoAddress = getDAOAddressFromDAODAOUrl(daodaoUrl)
  const rpcEndpoint = getConnectionFromToken(daoAddress, 'rpc', network)
  const cosmClient = await CosmWasmClient.connect(rpcEndpoint)
  const daoInfo = await checkForDAODAODAO(cosmClient, daodaoUrl);
  // If there isn't a governance token associated with this DAO, fail with message
  if (!daoInfo || !daoInfo.hasOwnProperty('gov_token')) {
    throw "We couldn't find any governance token associated with your DAO :/\nPerhaps destroyed in a supernova?";
  }
  const cw20Input = daoInfo['gov_token']
  // Now that we have the cw20 token address and network, get the info we want
  const tokenInfo = await checkForCW20(cosmClient, cw20Input, false)

  return {
    network,
    cw20Input,
    tokenType: 'cw20',
    tokenSymbol: tokenInfo.symbol,
    decimals: tokenInfo.decimals,
  };
}

module.exports = {  
  daodao: {
    name: 'DAODAO',
    isTokenType: isDaoDaoAddress,
    getTokenDetails: getDaoDaoTokenDetails,
    // There is no getTokenBalance because daodao tokens get stored
    // CW20, so we just call the getTokenBalance in cw20.js instead.
    // TO-DO: Ideally daodao would be a layer on top of CW20 since it's
    // not strictly a token itself, but not positive what that looks like yet.
  },
}
