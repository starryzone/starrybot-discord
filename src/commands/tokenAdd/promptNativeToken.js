module.exports = {
  promptNativeToken: {
    getConfig: async (state, { db: { roleGet }}) => {
      // See which button they pressed and update the state appropriatley
      const selectedToken = state.interactionTarget.customId;
      switch (selectedToken) {
        case 'juno':
          state.tokenAddress = 'juno';
          state.tokenSymbol = 'juno';
          state.network = 'mainnet';
          break;
        case 'stars':
          state.tokenAddress = 'stars';
          state.tokenSymbol = 'stars';
          state.network = 'network';
          break;
        case 'suggestion':
        default:
          // They picked the "suggest another" option
          return {
            message: '🌟 Please fill out this form, friend:\n\nhttps://sfg8dsaynp1.typeform.com/to/RvAbowUd',
          }
      }

      return {
        next: 'createTokenRule',
        prompt: {
          type: 'modal',
          title: `Configure ${selectedToken.toUpperCase()} Token Rule`,
          inputs: [
            {
              label: 'Role Name',
              placeholder: 'Please enter the name of the role that should created',
              id: 'role-name',
              required: true,
            },
            {
              label: 'Token Amount',
              placeholder: 'Please enter the number of tokens a user must have to get a special role',
              id: 'token-amount',
              required: true,
            }
          ]
        }
      }
    }
  }
}
