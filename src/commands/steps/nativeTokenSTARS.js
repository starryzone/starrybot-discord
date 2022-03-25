

module.exports = {
  nativeTokenSTARS: {
    name: 'nativeTokenSTARS',
    config: async (req, res, ctx, next) => {    
      ctx.tokenAddress = 'stars'
      ctx.tokenSymbol = 'stars'
      ctx.network = 'mainnet'

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
