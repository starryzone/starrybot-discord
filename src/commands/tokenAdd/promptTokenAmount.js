module.exports = {
  promptTokenAmount: {
    name: 'promptTokenAmount',
    config: async (args) => {
      let { userInput: amountOfTokensNeeded } = args;

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
      if (args.tokenType === 'native' || args.tokenType === 'cw20') {
        console.log('Multiplying by the number of decimals', args.decimals)
        args.minimumTokensNeeded = amountOfTokensNeeded * (10 ** args.decimals)
        console.log('New amount needed', args.minimumTokensNeeded)
      }

      // Building the user friendly name for what they're making
      let noun = `${amountOfTokensNeeded} `;
      switch (args.tokenType) {
        case('native'):
          noun = `${noun} ${args.tokenSymbol}`;
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
