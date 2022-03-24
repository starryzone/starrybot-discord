const { getTokenDetails } = require('../../astrolabe')
const { isStargazeLaunchpadAddress, getCW721FromStargazeUrl } = require("../../astrolabe/stargaze");
const { createEmbed } = require("../../utils/messages");

async function handleCW721Entry(req, res, ctx, next) {
	const { interaction } = req;

  const userInput = interaction.content;
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
  } catch (e) {
    // Notify the channel with whatever went wrong in this step
    return await res.error(e);
  }

  await interaction.reply({
    embeds: [
      createEmbed({
        title: 'What is the role name?',
        description: `Please enter the name of the role that should be given to users with at least 1 NFT from this collection.`,
        footer: 'Note: this role will be created automatically',
      }),
    ]
  });

  next('promptTokenName')
}

module.exports = {
  handleCW721Entry,
}
