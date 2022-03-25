module.exports = {
  nativeTokenJUNO: {
    name: 'nativeTokenJUNO',
    config: async (args) => {
      args.tokenAddress = 'juno'
      args.tokenSymbol = 'juno'
      args.network = 'mainnet'

      return {
        embeds: [
          {
            title: 'How many native tokens?',
            description: 'Please enter the number of tokens a user must have to get a special role.',
          }
        ],
        next: 'promptTokenAmount',
      }
    }
  }
}
