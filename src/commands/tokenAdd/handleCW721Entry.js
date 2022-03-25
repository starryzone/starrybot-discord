const { getTokenDetails } = require('../../astrolabe')
const { isStargazeLaunchpadAddress, getCW721FromStargazeUrl } = require("../../astrolabe/stargaze");

module.exports = {
  handleCW721Entry: {
    name: 'handleCW721Entry',
    config: async (req, ctx, next) => {
      const userInput = ctx.userInput;
      // If user has done something else (like emoji reaction) do nothing
      if (!userInput) return;

      let results;
      try {
        const tokenAddress = isStargazeLaunchpadAddress(userInput) ?
          await getCW721FromStargazeUrl(userInput) :
          userInput;
        results = await getTokenDetails({ tokenAddress });

        ctx.tokenAddress = results.cw721;
        ctx.network = results.network;
        ctx.tokenType = results.tokenType;
        ctx.tokenSymbol = results.tokenSymbol;
        ctx.minimumTokensNeeded = 1;
        ctx.decimals = results.decimals;
      } catch (error) {
        // Notify the channel with whatever went wrong in this step
        return { error };
      }

      return {
        embeds: [
          {
            title: 'What is the role name?',
            description: `Please enter the name of the role that should be given to users with at least 1 NFT from this collection.`,
            footer: 'Note: this role will be created automatically',
          }
        ],
        next: 'promptTokenName',
      }
    }
  }
}
