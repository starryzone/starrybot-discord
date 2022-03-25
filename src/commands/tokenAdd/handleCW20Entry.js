const { getTokenDetails } = require('../../astrolabe')
const { isDaoDaoAddress, getCW20InputFromDaoDaoDao } = require('../../astrolabe/daodao');

module.exports = {
  handleCW20Entry: {
    name: 'handleCW20Entry',
    config: async (req, res, ctx, next) => {
      const { interaction } = req;

      const userInput = interaction.content;
      // If user has done something else (like emoji reaction) do nothing
      if (!userInput) return;

      try {
        let tokenAddress = userInput
        if (isDaoDaoAddress(userInput)) {
          const daoDetails = await getCW20InputFromDaoDaoDao(userInput)
          tokenAddress = daoDetails.govToken
          ctx.stakingContract = daoDetails.stakingContract;
        }
        const results = await getTokenDetails({ tokenAddress });

        ctx.tokenAddress = results.cw20Input;
        ctx.network = results.network;
        ctx.tokenType = results.tokenType;
        ctx.tokenSymbol = results.tokenSymbol;
        ctx.decimals = results.decimals;
      } catch (error) {
        // Notify the channel with whatever went wrong in this step
        return { error };
      }

      return {
        embeds: [
          {
            title: 'How many tokens?',
            description: 'Please enter the number of tokens a user must have to get a special role.',
          }
        ],
        next: 'promptTokenAmount',
      }
    }
  }
}
