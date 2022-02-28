const { daodao } = require('./daodao');
const { cw20 } = require('./cw20');
const { native } = require('./native');
const { StargateClient } = require('@cosmjs/stargate');

// cw20 must be last right now, as the others are
// easier to check for
const allTokenTypes = [ native, daodao, cw20 ];

// Given any of a DAODAO URL, CW20 token address, or a native token,
// return what type we've been given
const getTokenType = (tokenInput) => {
  return allTokenTypes.find(tokenType => tokenType.isTokenType(tokenInput));
}

// Identify what type of token we have, then call
// the corresponding getTokenDetail when we have a match
const getTokenDetails = async (tokenInput) => {
  let tokenDetails;

  const tokenType = getTokenType(tokenInput);
  try {
    tokenDetails = await tokenType.getTokenDetails(tokenInput);
  } catch (e) {
    // First try to log what chain failed
    let chainId;
    try {
      // It's possible for this to also fail, but we still want to know what went wrong
      chainId = await cosmClient.getChainId();
    }  catch (e) {
      chainId = '[chain ID not found]'
    }
    console.error(`Error message after trying to query ${currentTokenType.name} on ${chainId}`, e.message)

    // Throw a more specific error message if we can
    if (e.message.includes('decoding bech32 failed')) {
      throw 'Invalid address. Remember: first you copy, then you paste.';
    } else if (e.message.includes('contract: not found')) {
      throw 'No contract at that address. Probable black hole.';
    } else if (e.message.includes('Error parsing into type')) {
      throw 'That is a valid contract, but cosmic perturbations tell us it is not a cw20.';
    }
  }

  return tokenDetails || {};
}

const getTokenRpcEndpoint = async (tokenAddress, network) => {
  const tokenType = getTokenType(tokenAddress);
  if (tokenType) {
    return tokenType.getTokenRpcEndpoint(tokenAddress, network);
  } else {
    throw 'Not a valid token address';
  }
}

const getTokenRpcClient = async (tokenAddress, network) => {
  const rpcEndpoint = await getTokenRpcEndpoint(tokenAddress, network);
  if (!rpcEndpoint) {
   throw `Issue getting RPC endpoint for ${tokenAddress}`;
  }
  return StargateClient.connect(rpcEndpoint);
}

const getTokenBalance = async (keplrAccount, tokenAddress, network) => {
  const tokenType = getTokenType(tokenAddress);
  return tokenType.getTokenBalance(keplrAccount, tokenAddress, network);
}

module.exports = {
  getTokenType,
  getTokenBalance,
  getTokenDetails,
  getTokenRpcEndpoint,
  getTokenRpcClient,
}
