module.exports = {
  nativeTokenSTARS: {
    name: 'nativeTokenSTARS',
    setArgs: {
      tokenAddress: 'stars',
      tokenSymbol: 'stars',
      network: 'mainnet',
    },
    config: {
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
