module.exports = {
  nativeTokenJUNO: {
    stateOnEnter: {
      tokenAddress: 'juno',
      tokenSymbol: 'juno',
      network: 'mainnet',
    },
    next: 'promptTokenName',
    prompt: {
      type: 'modal',
      title: 'Configure JUNO Token Rule',
      inputs: [
        {
          label: 'Role Name',
          placeholder: 'Please enter the name of the role that should created',
          id: 'role-name',
          required: true,
        },
        {
          label: 'Token Amount',
          placeholder: 'Please enter the number of tokens a user must have to get a special role.',
          id: 'token-amount',
          required: true,
        }
      ]
    }
  }
}
