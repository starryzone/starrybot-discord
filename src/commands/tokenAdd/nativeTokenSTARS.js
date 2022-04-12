module.exports = {
  nativeTokenSTARS: {
    stateOnEnter: {
      tokenAddress: 'stars',
      tokenSymbol: 'stars',
      network: 'mainnet',
    },
    next: 'promptTokenAmount',
    prompt: {
      type: 'input',
      title: 'How many native tokens?',
      description: 'Please enter the number of tokens a user must have to get a special role.',
    }
  }
}
