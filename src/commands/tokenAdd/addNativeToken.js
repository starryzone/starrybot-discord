module.exports = {
  addNativeToken: {
    stateOnEnter: {
      tokenType: 'native',
      // According to Meow, all native tokens have 6 decimals
      decimals: 6,
    },
    getConfig: async ({}, { networks: { networkPrefixes }}) => ({
      prompt: {
        type: 'button',
        title: 'Please choose from the supported Cosmos chains:',
        options: [
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
    })
  }
}
