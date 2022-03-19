const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromPrefix, getConnectionFromToken, getPrefixFromToken } = require('../networks')
const {Bech32} = require("@cosmjs/encoding");

const checkForCW721 = async (cosmClient, cw721Input) => {
  return cosmClient.queryContractSmart(cw721Input, {
    contract_info: { },
  });
}

const attemptCW721Lookup = async (cw721Input, network) => {
  let rpcEndpoint = getConnectionFromToken(cw721Input, 'rpc', network)
  let cosmClient = await CosmWasmClient.connect(rpcEndpoint)
  return await checkForCW721(cosmClient, cw721Input)
}

const getTokenInfo = async ({tokenAddress, network}) =>  {
  let tokenInfo;

  // If they defined network use it
  if (network) {
    tokenInfo = await attemptCW721Lookup(tokenAddress, network)
  } else {
    // No network defined, check for existence on mainnet then testnet
    network = 'mainnet';
    try {
      tokenInfo = await attemptCW721Lookup(tokenAddress, network)
    } catch {
      // Nothing was found on mainnet but this could still be on testnet,
      // so swallow the error and try testnet instead
      network = 'testnet'
      tokenInfo = await attemptCW721Lookup(tokenAddress, network)
    }
  }
  return tokenInfo
}

const getCW721TokenDetails = async ({tokenAddress, network}) => {
  let tokenInfo = await getTokenInfo({tokenAddress, network})

  return {
    network: network,
    cw721: tokenAddress,
    tokenType: 'cw721',
    tokenSymbol: tokenInfo.symbol,
    decimals: null, // keep null
  }
}

const getCW721TokenBalance = async (keplrAccount, tokenAddress, network) => {
  // Given the wallet address, NFT collection address,
  // and the network it's on, do the math for the following correctly
  const decodedAccount = Bech32.decode(keplrAccount).data;
  const prefix = getPrefixFromToken(tokenAddress);
  if (!prefix) throw 'Could not determine prefix';

  const encodedAccount = Bech32.encode(prefix, decodedAccount);
  const rpcEndpoint = getConnectionFromPrefix(prefix, 'rpc', network);
  const cosmClient = await CosmWasmClient.connect(rpcEndpoint);
  const nftInfo = await cosmClient.queryContractSmart(tokenAddress, {
    tokens: {
      owner: encodedAccount,
    }
  });

  // Return the # of NFTs this user has from this wallet
  return parseInt(nftInfo.tokens.length);
}

const isCW721 = async (tokenAddress, network) => {
  let tokenInfo = await getTokenInfo({tokenAddress, network})
  // Expecting this format:
  // { tokens: [ '00154', '02097', '02355' ] }
  if (tokenInfo &&
    Object.keys(tokenInfo).length === 2 &&
    tokenInfo.hasOwnProperty('name') &&
    tokenInfo.hasOwnProperty('symbol')
  ) {
    return true
  } else {
    return false
  }
}

module.exports = {
  cw721: {
    name: 'CW721',
    isTokenType: isCW721,
    getTokenBalance: getCW721TokenBalance,
    getTokenDetails: getCW721TokenDetails,
  }
}
