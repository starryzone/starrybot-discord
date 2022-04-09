module.exports = {
  promptTokenAmount: {
    getConfig: async (state) => {
      let { userInput: amountOfTokensNeeded } = state;

      if (
        !Number.isInteger(parseInt(amountOfTokensNeeded)) ||
        amountOfTokensNeeded <= 0
      ) {
        // Invalid reply
        return {
          error: 'Need a positive number of tokens.',
        };
      }

      // Multiply by the decimals for native and fungible tokens
      if (state.tokenType === 'native' || state.tokenType === 'cw20') {
        console.log('Multiplying by the number of decimals', state.decimals)
        state.minimumTokensNeeded = amountOfTokensNeeded * (10 ** state.decimals)
        console.log('New amount needed', state.minimumTokensNeeded)
      }

      // Building the user friendly name for what they're making
      let noun = `${amountOfTokensNeeded} `;
      switch (state.tokenType) {
        case('native'):
          noun = `${noun} ${state.tokenSymbol}`;
          break;
        case('cw20'):
          noun = `${noun} cw20 token(s)`;
          break;
        // cw721 doesn't go through this step
        default:
          noun = `${noun} token(s)`;
          break;
      }

      return {
        next: 'promptTokenName',
        prompt: {
          type: 'input',
          title: 'What is the role name?',
          description: `Please enter the name of the role that should be given to users with at least ${noun}.`,
          footer: 'Note: this role will be created automatically',
        }
      }
    }
  }
}
