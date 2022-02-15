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

const checkForDAODAODAO = async (cosmClient, daoDAOUrl, gracefulExit) => {
  let daoInfo
  try {
    const daoAddressRegex = /^https:\/\/(testnet\.)?daodao.zone\/dao\/(\w*)/;
    const regexMatches = daoAddressRegex.exec(daoDAOUrl);
    // [0] is the string itself, [1] is the (testnet\.) capture group, [2] is the (\w*) capture group
    const daoAddress = regexMatches[2];
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

module.exports = {
    checkForCW20,
    checkForDAODAODAO,
}
