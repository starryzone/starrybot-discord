module.exports = {
  promptTokenAmount: {
    name: 'promptTokenAmount',
    config: async (ctx) => {
      let amountOfTokensNeeded = ctx.userInput;

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
      if (ctx.tokenType === 'native' || ctx.tokenType === 'cw20') {
        console.log('Multiplying by the number of decimals', ctx.decimals)
        ctx.minimumTokensNeeded = amountOfTokensNeeded * (10 ** ctx.decimals)
        console.log('New amount needed', ctx.minimumTokensNeeded)
      }

      // Building the user friendly name for what they're making
      let noun = `${amountOfTokensNeeded} `;
      switch (ctx.tokenType) {
        case('native'):
          noun = `${noun} ${ctx.tokenSymbol}`;
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
        embeds: [
          {
            title: 'What is the role name?',
            description: `Please enter the name of the role that should be given to users with at least ${noun}.`,
            footer: 'Note: this role will be created automatically',
          }
        ],
        next: 'promptTokenName',
      }
    }
  }
}
