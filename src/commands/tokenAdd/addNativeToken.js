const { networkPrefixes } = require('../../astrolabe/networks');

module.exports = {
  addNativeToken: {
    name: 'addNativeToken',
    setArgs: {
      tokenType: 'native',
      // According to Meow, all native tokens have 6 decimals
      decimals: 6,
    },
    config: {
      content: 'Please choose from the supported Cosmos chains:',
      buttons: [
        ...networkPrefixes.map(prefix => ({
          next: `nativeToken${prefix.toUpperCase()}`,
          label: prefix.toUpperCase()
        })),
        {
          next: `nativeTokenSuggestion`,
          label: '🙋🏽 Suggest another!'
        }
      ]
    }
  }
}
