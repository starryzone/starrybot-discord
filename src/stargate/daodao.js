
const getDAOAddressFromDAODAOUrl = daoDAOUrl => {
  const daoAddressRegex = /^https:\/\/(testnet\.)?daodao.zone\/dao\/(\w*)/;
  const regexMatches = daoAddressRegex.exec(daoDAOUrl);
  // [0] is the string itself, [1] is the (testnet\.) capture group, [2] is the (\w*) capture group
  return regexMatches[2];
}

const checkForDAODAODAO = async (cosmClient, daoDAOUrl, gracefulExit) => {
  let daoInfo
  try {
    const daoAddress = getDAOAddressFromDAODAOUrl(daoDAOUrl)
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
  getDAOAddressFromDAODAOUrl,
  checkForDAODAODAO,
  
  daodao: {},
}
