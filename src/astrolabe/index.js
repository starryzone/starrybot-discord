const { cw20 } = require('./cw20');
const { native } = require('./native');

// cw20 must be last right now, as the others are
// easier to check for
const allTokenTypes = [ native, cw20 ];

// Given any of a DAODAO URL, CW20 token address, or a native token,
// return the handler for that token type
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
    // Throw a more specific error message if we can
    if (e.message.includes('decoding bech32 failed')) {
      throw 'Invalid address. Remember: first you copy, then you paste.';
    } else if (e.message.includes('contract: not found')) {
      throw 'No contract at that address. Probable black hole.';
    } else if (e.message.includes('Error parsing into type')) {
      throw 'That is a valid contract, but cosmic perturbations tell us it is not a cw20.';
    } else {
      throw `Error message after trying to query ${tokenType.name}: ${e.message}`;
    }
  }

  return tokenDetails || {};
}

const getTokenBalance = async (keplrAccount, tokenAddress, network) => {
  const tokenType = getTokenType(tokenAddress);
  return tokenType.getTokenBalance(keplrAccount, tokenAddress, network);
}

module.exports = {
  getTokenBalance,
  getTokenDetails,
}
