module.exports = {
  addNativeToken: {
    stateOnEnter: {
      tokenType: 'native',
      // According to Meow, all native tokens have 6 decimals
      decimals: 6,
    },
    getConfig: async ({}, { networks: { networkPrefixes }}) => ({
      next: 'promptNativeToken',
      prompt: {
        type: 'button',
        title: 'Please choose from the supported Cosmos chains:',
        options: [
          ...networkPrefixes.map(prefix => ({
            value: prefix,
            label: prefix.toUpperCase()
          })),
          {
            value: `suggestion`,
            label: '🙋🏽 Suggest another!'
          }
        ]
      }
    })
  }
}
