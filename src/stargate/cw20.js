const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromToken } = require('../utils/networks')

// This will check mainnet or testnet for the existence and balance of the cw20 contract
// gracefulExit is useful when we check if it's on mainnet first, then testnet.
//   if it's not on mainnet, we don't want it to fail, basically
const checkForCW20 = async (cosmClient, cw20Input, gracefulExit) => {
  let tokenInfo
  try {
    tokenInfo = await cosmClient.queryContractSmart(cw20Input, {
      token_info: { },
    })
  } catch (e) {
    let chainId;
    try {
      // It's possible for this to also fail, but we still want to know what went wrong
      chainId = await cosmClient.getChainId();
    }  catch (e) {
      chainId = '[chain ID not found]'
    }
    tokenInfo = false
    console.error(`Error message after trying to query cw20 on ${chainId}`, e.message)
    if (e.message.includes('decoding bech32 failed')) {
      throw 'Invalid address. Remember: first you copy, then you paste.';
    } else if (e.message.includes('contract: not found')) {
      if (gracefulExit) return false
      throw 'No contract at that address. Potential black hole.';
    } else if (e.message.includes('Error parsing into type')) {
      if (gracefulExit) return false
      throw 'That is a valid contract, but cosmic perturbations tell us it is not a cw20.';
    }
  }
  return tokenInfo
}

const getCW20TokenDetails = async (cw20Input) => {
  let network = 'mainnet';
  // Check user's cw20 token for existence on mainnet then testnet
  let rpcEndpoint = getConnectionFromToken(cw20Input, 'rpc', 'mainnet')
  let cosmClient = await CosmWasmClient.connect(rpcEndpoint)
  let tokenInfo = await checkForCW20(cosmClient, cw20Input, true)
  if (tokenInfo === false) {
    // Nothing was found on mainnet, try testnet
    network = 'testnet'
    rpcEndpoint = getConnectionFromToken(cw20Input, 'rpc', network)
    cosmClient = await CosmWasmClient.connect(rpcEndpoint)
    tokenInfo = await checkForCW20(cosmClient, cw20Input, false)
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
