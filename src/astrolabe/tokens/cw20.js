const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { Bech32 } = require('@cosmjs/encoding')
const { getConnectionFromPrefix, getConnectionFromToken, getPrefixFromToken } = require('../networks')

const checkForCW20 = async (cosmClient, cw20Input) => {
  return await cosmClient.queryContractSmart(cw20Input, {
    token_info: { },
  });
}

const attemptCW20Lookup = async (cw20Input, network) => {
  let rpcEndpoint = getConnectionFromToken(cw20Input, 'rpc', network)
  let cosmClient = await CosmWasmClient.connect(rpcEndpoint)
  return await checkForCW20(cosmClient, cw20Input)
}

const getTokenInfo = async ({tokenAddress, network}) =>  {
  let tokenInfo;

  // If they defined network use it
  if (network) {
    tokenInfo = await attemptCW20Lookup(tokenAddress, network)
  } else {
    // No network defined, check for existence on mainnet then testnet
    network = 'mainnet';
    try {
      tokenInfo = await attemptCW20Lookup(tokenAddress, network)
    } catch {
      // Nothing was found on mainnet but this could still be on testnet,
      // so swallow the error and try testnet instead
      network = 'testnet'
      tokenInfo = await attemptCW20Lookup(tokenAddress, network)
    }
  }
  return { token: tokenInfo, network }
}

const getCW20TokenDetails = async ({tokenAddress, network}) => {
  let tokenInfo = await getTokenInfo({tokenAddress, network})
  console.log(tokenInfo);
  return {
    network: tokenInfo.network,
    cw20Input: tokenAddress,
    tokenType: 'cw20',
    tokenSymbol: tokenInfo.token.symbol,
    decimals: tokenInfo.token.decimals,
  }
}

const getStakedCW20TokenBalance = async ({keplrAccount, tokenAddress, network, extra}) => {
  const decodedAccount = Bech32.decode(keplrAccount).data;
  const prefix = getPrefixFromToken(tokenAddress);
  if (!prefix) throw 'Could not determine prefix';
  const encodedAccount = Bech32.encode(prefix, decodedAccount);
  const rpcEndpoint = getConnectionFromPrefix(prefix, 'rpc', network);
  const cosmClient = await CosmWasmClient.connect(rpcEndpoint);
  let balance = 0
  if (extra?.staking_contract) {
    const stakedTokens = await cosmClient.queryContractSmart(extra['staking_contract'], {
      staked_value: { address: encodedAccount},
    })
    console.log('Found staked tokens', stakedTokens.value)
    balance = stakedTokens.value
  }

  return balance;
}

const getCW20TokenBalance = async ({keplrAccount, tokenAddress, network, extra}) => {
  const decodedAccount = Bech32.decode(keplrAccount).data;
  const prefix = getPrefixFromToken(tokenAddress);
  if (!prefix) throw 'Could not determine prefix';

  const encodedAccount = Bech32.encode(prefix, decodedAccount);
  const rpcEndpoint = getConnectionFromPrefix(prefix, 'rpc', network);
  const cosmClient = await CosmWasmClient.connect(rpcEndpoint);
  const smartContract = await cosmClient.queryContractSmart(tokenAddress, {
    balance: {
      address: encodedAccount,
    }
  });

  let balance = smartContract.balance

  // If there's a staking, figure out balance
  if (extra?.staking_contract) {
    const stakedTokens = await cosmClient.queryContractSmart(extra['staking_contract'], {
      staked_value: { address: encodedAccount},
    })
    console.log('Found staked tokens', stakedTokens.value)
    balance += stakedTokens.value
  }

  return parseInt(balance);
}

const isCW20 = async (tokenAddress, network) => {
  let validCW20 = true
  try {
    console.log(tokenAddress);
    let tokenInfo = await getTokenInfo({tokenAddress, network})
    console.log(tokenInfo);
    // Expecting this format for tokenInfo.token:
    // {
    //   name: 'Mochi boo-boo',
    //   symbol: 'MOCHI',
    //   decimals: 6,
    //   total_supply: '19000000'
    // }
    if (tokenInfo.token &&
      Object.keys(tokenInfo.token).length !== 4 ||
      !tokenInfo.token.hasOwnProperty('name') ||
      !tokenInfo.token.hasOwnProperty('symbol') ||
      !tokenInfo.token.hasOwnProperty('decimals') ||
      !tokenInfo.token.hasOwnProperty('total_supply')) {
      validCW20 = false
    }
  } catch {
    validCW20 = false
  }
  return validCW20
}

module.exports = {
  cw20: {
    name: 'CW20',
    isTokenType: isCW20,
    getTokenBalance: getCW20TokenBalance,
    getStakedTokenBalance: getStakedCW20TokenBalance,
    getTokenDetails: getCW20TokenDetails,
  }
}
