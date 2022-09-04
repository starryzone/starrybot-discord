module.exports = {
  nativeTokenJUNO: {
    stateOnEnter: {
      tokenAddress: 'juno',
      tokenSymbol: 'juno',
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
