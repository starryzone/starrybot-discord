const { networkPrefixes } = require('./networks');

module.exports = {
  native: {
    name: 'native',
    isTokenType: token => networkPrefixes.includes(token),
  }
}
