module.exports = {
  handleCW20Entry: {
    name: 'handleCW20Entry',
    getConfig: async (
      args,
      {
        astrolabe: { getTokenDetails },
        daodao: { isDaoDaoAddress, getCW20InputFromDaoDaoDao }
      }
    ) => {
      const { userInput } = args;
      // If user has done something else (like emoji reaction) do nothing
      if (!userInput) return;

      try {
        let tokenAddress = userInput
        if (isDaoDaoAddress(userInput)) {
          const daoDetails = await getCW20InputFromDaoDaoDao(userInput)
          tokenAddress = daoDetails.govToken
          args.stakingContract = daoDetails.stakingContract;
        }
        const results = await getTokenDetails({ tokenAddress });

        args.tokenAddress = results.cw20Input;
        args.network = results.network;
        args.tokenType = results.tokenType;
        args.tokenSymbol = results.tokenSymbol;
        args.decimals = results.decimals;
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
