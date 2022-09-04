const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromPrefix, getConnectionFromToken, getPrefixFromToken } = require('../networks')
const { Bech32 } = require("@cosmjs/encoding");

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

const getTokenInfo = async ({ tokenAddress, network }) => {
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
  return { token: tokenInfo, network }
}

const getCW721TokenDetails = async ({tokenAddress, network}) => {
  let tokenInfo = await getTokenInfo({tokenAddress, network})

  return {
    network: tokenInfo.network,
    cw721: tokenAddress,
    tokenType: 'cw721',
    tokenSymbol: tokenInfo.token.symbol,
    decimals: null, // keep null
  }
}

const getStakedCW721TokenBalance = async ({keplrAccount, tokenAddress, network, extra}) => {
  // At the time of this writing, there is no NFT staking, so always return 0
  return 0
}

const getCW721TokenBalance = async ({keplrAccount, tokenAddress, network, extra}) => {
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
  // Expecting this format for tokenInfo.token:
  // { name: 'Passage Marketplace', symbol: 'yawp' }
  return tokenInfo.token &&
    Object.keys(tokenInfo.token).length === 2 &&
    tokenInfo.token.hasOwnProperty('name') &&
    tokenInfo.token.hasOwnProperty('symbol');
}

module.exports = {
  cw721: {
    name: 'CW721',
    isTokenType: isCW721,
    getTokenBalance: getCW721TokenBalance,
    getStakedTokenBalance: getStakedCW721TokenBalance,
    getTokenDetails: getCW721TokenDetails,
  }
}
