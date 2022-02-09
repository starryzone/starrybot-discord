// This will check mainnet or testnet for the existence and balance of the cw20 contract
// gracefulExit is useful when we check if it's on mainnet first, then testnet.
//   if it's not on mainnet, we don't want it to fail, basically
const checkForCW20 = async (parentWizard, cosmClient, cw20Input, gracefulExit) => {
  let tokenInfo
  try {
    tokenInfo = await cosmClient.queryContractSmart(cw20Input, {
      token_info: { },
    })
  } catch (e) {
    const chainId = await cosmClient.getChainId()
    tokenInfo = false
    console.error(`Error message after trying to query cw20 on ${chainId}`, e.message)
    if (e.message.includes('decoding bech32 failed')) {
      return await parentWizard.failure('Invalid address. Remember: first you copy, then you paste.');
    } else if (e.message.includes('contract: not found')) {
      if (gracefulExit) return false
      return await parentWizard.failure('No contract at that address. Potential black hole.');
    } else if (e.message.includes('Error parsing into type')) {
      if (gracefulExit) return false
      throw 'That is a valid contract, but cosmic perturbations tell us it is not a cw20.';
    }
  }
  return tokenInfo
}

const checkForDAODAODAO = async (parentWizard, cosmClient, daoDAOUrl, gracefulExit) => {
  let daoInfo
  try {
    const splitUrl = daoDAOUrl.split('/')
    const daoAddress = splitUrl[splitUrl.length -1]
    console.log('daoAddress', daoAddress)
    daoInfo = await cosmClient.queryContractSmart(daoAddress, {
      get_config: { },
    })
    console.log('daoInfo', daoInfo)
  } catch (e) {
    const chainId = await cosmClient.getChainId()
    console.error(`Error message after trying to query daodao dao on ${chainId}`, e.message)
    // TODO: reduce copy pasta
    if (e.message.includes('decoding bech32 failed')) {
      return await parentWizard.failure('Invalid address. Remember: first you copy, then you paste.');
    } else if (e.message.includes('contract: not found')) {
      if (gracefulExit) return false
      return await parentWizard.failure('No contract at that address. Probable black hole.');
    } else if (e.message.includes('Error parsing into type')) {
      if (gracefulExit) return false
      return await parentWizard.failure('That is a valid contract, but cosmic perturbations tell us it is not a cw20.');
    }
  }
  return daoInfo
}

module.exports = {
    checkForCW20,
    checkForDAODAODAO,
}
