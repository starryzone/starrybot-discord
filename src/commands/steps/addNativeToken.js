
const { networkPrefixes } = require('../../astrolabe/networks');

module.exports = {
  addNativeToken: {
    name: 'addNativeToken',
    config: async (req, res, ctx, next) => {
      ctx.tokenType = 'native'
      // According to Meow, all native tokens have 6 decimals
      ctx.decimals = 6

      const buttons = [];
      for (const prefix of networkPrefixes) {
        buttons.push({
          customId: `nativeToken${prefix.toUpperCase()}`,
          label: prefix.toUpperCase()
        });
      }
      buttons.push({
        customId: `nativeTokenSuggestion`,
        label: '🙋🏽 Suggest another!'
      })
      return {
        content: 'Please choose from the supported Cosmos chains:',
        buttons,
      }
    }
  }
}
