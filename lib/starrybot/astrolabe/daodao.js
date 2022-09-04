const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromToken } = require('./networks')

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

const getCW20InputFromDaoDaoDao = async (daodaoUrl) => {
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
  return {
    govToken: daoInfo['gov_token'],
    stakingContract: daoInfo['staking_contract']
  };
}

module.exports = {
  isDaoDaoAddress,
  getCW20InputFromDaoDaoDao,
}
