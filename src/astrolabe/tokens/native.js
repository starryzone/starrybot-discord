const fetch = require("node-fetch");
const { Bech32 } = require('@cosmjs/encoding')
const { StargateClient } = require('@cosmjs/stargate');
const { networkPrefixes, getConnectionFromPrefix, getConnectionFromToken } = require('../networks');

const sumDelegationsForAccount = async (address) => {
	const lcdUrl = getConnectionFromToken(address, 'lcd', 'mainnet')
	const delegationRes = await fetch(`${lcdUrl}/staking/delegators/${address}/delegations`)
	const body = await delegationRes.json();
	const sum = body.result.reduce(
		(prevVal, currentVal) => prevVal + parseInt(currentVal.balance.amount),
		0
	);

	console.log('Sum of delegations', sum)
	return sum
}

const sumUnbondingDelegationsForAccount = async (address) => {
	const lcdUrl = getConnectionFromToken(address, 'lcd', 'mainnet')
	const unbondingRes = await fetch(`${lcdUrl}/staking/delegators/${address}/unbonding_delegations`)
	const body = await unbondingRes.json();

	const sum = body.result.reduce((prevVal, currentVal) => {
		const innerSum = currentVal.entries.reduce((innerPrevVal, innerCurrentVal) => {
			return innerPrevVal + parseInt(innerCurrentVal.balance);
		}, 0);
		return prevVal + innerSum;
	}, 0);

	console.log('Sum of delegations currently unbonding', sum)
	return sum
}

const getNativeTokenBalance = async (keplrAccount, tokenAddress, network) => {
  const decodedAccount = Bech32.decode(keplrAccount).data;
  // Token type is native, so the token address is expected to be a prefix
  const encodedAccount = Bech32.encode(tokenAddress, decodedAccount);
  const rpcClient = await getNativeRpcClient(tokenAddress, network);
  const balances = await rpcClient.getAllBalances(encodedAccount);
  console.log(`balances ${tokenAddress}`, balances);
  let matches = balances.filter(balances => balances.denom === `u${tokenAddress}`);

  // A user can potentially have no liquid stars, account for that
  if (matches.length === 0) {
    matches = [{
      amount: 0
    }]
  }
  console.log('Liquid native tokens', matches[0].amount)

  // Now check for delegation amounts if mainnet
  if (network === 'mainnet') {
    const delegationTotal = await sumDelegationsForAccount(encodedAccount)
    matches[0].amount = parseInt(matches[0].amount) + delegationTotal
    console.log('Sum of liquid and staked', matches[0].amount)
    const unbondingDelegationTotal = await sumUnbondingDelegationsForAccount(encodedAccount)
    matches[0].amount = parseInt(matches[0].amount) + unbondingDelegationTotal
    console.log('Sum of liquid and staked and unbonding', matches[0].amount)
  }

  return parseInt(matches[0].amount);
}

const getNativeRpcEndpoint = (tokenAddress, network) => {
  return getConnectionFromPrefix(tokenAddress, 'rpc', network);
}

const getNativeRpcClient = async (tokenAddress, network) => {
  const rpcEndpoint = getNativeRpcEndpoint(tokenAddress, network);
  if (!rpcEndpoint) {
   throw `Issue getting RPC endpoint for ${tokenAddress}`;
  }
  return StargateClient.connect(rpcEndpoint);
}

module.exports = {
  native: {
    name: 'native',
    isTokenType: token => networkPrefixes.includes(token),
    getTokenBalance: getNativeTokenBalance,
  }
}
