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
      tokenDetails = await currentTokenType.getTokenDetails(tokenInput);
    }
    tokenIndex++;
  }
  return tokenDetails || {};
}

module.exports = {
  getTokenDetails,
}
