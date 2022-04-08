const {getConnectionFromToken} = require("../astrolabe/networks");
const fetch = require("node-fetch");

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

module.exports ={
  sumDelegationsForAccount,
  sumUnbondingDelegationsForAccount
}
