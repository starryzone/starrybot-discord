const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromToken } = require('./networks')

const checkForCW20 = async (cosmClient, cw20Input) => {
  return cosmClient.queryContractSmart(cw20Input, {
    token_info: { },
  });
}

const getCW20TokenDetails = async (cw20Input) => {
  let network = 'mainnet';
  // Check user's cw20 token for existence on mainnet then testnet
  let rpcEndpoint = getConnectionFromToken(cw20Input, 'rpc', 'mainnet')
  let cosmClient = await CosmWasmClient.connect(rpcEndpoint)
  let tokenInfo;
  try {
    tokenInfo = await checkForCW20(cosmClient, cw20Input)
  } catch {
    // Nothing was found on mainnet but this could still be on testnet,
    // so swallow the error and try testnet instead
    network = 'testnet'
    rpcEndpoint = getConnectionFromToken(cw20Input, 'rpc', network)
    cosmClient = await CosmWasmClient.connect(rpcEndpoint)
    tokenInfo = await checkForCW20(cosmClient, cw20Input)
  }

  return {
    network,
    cw20Input,
    tokenType: 'cw20',
    tokenSymbol: tokenInfo.symbol,
    decimals: tokenInfo.decimals,
  }
}

module.exports = {
  // Used by Daodao's getTokenDetails
  checkForCW20,

  cw20: {
    name: 'CW20',
    isTokenType: () => true, // TO-DO: is there a way to tell?
    checkFor: checkForCW20,
    getTokenDetails: getCW20TokenDetails,
  }
}
