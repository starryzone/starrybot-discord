module.exports = {
  handleCW20Entry: {
    getConfig: async (
      state,
      {
        astrolabe: { getTokenDetails },
        daodao: { isDaoDaoAddress, getCW20InputFromDaoDaoDao }
      }
    ) => {
      const { userInput } = state;
      // If user has done something else (like emoji reaction) do nothing
      if (!userInput) return;

      try {
        let tokenAddress = userInput
        if (isDaoDaoAddress(userInput)) {
          const daoDetails = await getCW20InputFromDaoDaoDao(userInput)
          tokenAddress = daoDetails.govToken
          state.stakingContract = daoDetails.stakingContract;
        }
        const results = await getTokenDetails({ tokenAddress });

        state.tokenAddress = results.cw20Input;
        state.network = results.network;
        state.tokenType = results.tokenType;
        state.tokenSymbol = results.tokenSymbol;
        state.decimals = results.decimals;
      } catch (error) {
        // Notify the channel with whatever went wrong in this step
        return { error };
      }

      return {
        next: 'promptTokenAmount',
        prompt: {
          type: 'input',
          title: 'How many tokens?',
          description: 'Please enter the number of tokens a user must have to get a special role.',
        }
      }
    }
  }
}
