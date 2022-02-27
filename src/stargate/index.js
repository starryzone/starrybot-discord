const { daodao } = require('./daodao');
const { cw20 } = require('./cw20');

// cw20 must be last right now, as the others are
// easier to check for
const allTokenTypes = [ daodao, cw20 ];

// Identify what type of token we have, then call
// the corresponding getTokenDetail when we have a match
const getTokenDetails = async (tokenInput) => {
  let tokenDetails;
  let currentTokenType, tokenIndex = 0;

  // Until we either have tokenDetails defined, or we've exhausted our
  // list, try to find a matching token type to get details for
  while (!tokenDetails && tokenIndex < allTokenTypes.length) {
    currentTokenType = allTokenTypes[tokenIndex];
    if (currentTokenType.isTokenType(tokenInput)) {
      try {
        tokenDetails = await currentTokenType.getTokenDetails(tokenInput);
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
    }
    tokenIndex++;
  }
  return tokenDetails || {};
}

module.exports = {
  getTokenDetails,
}
