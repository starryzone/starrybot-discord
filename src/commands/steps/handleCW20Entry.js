const { getTokenDetails } = require('../../astrolabe')
const { createEmbed } = require("../../utils/messages");

async function handleCW20Entry(req, res, ctx, next) {
	const { interaction } = req;

  const userInput = interaction.content;
  // If user has done something else (like emoji reaction) do nothing
  if (!userInput) return;

  try {
    const results = await getTokenDetails(userInput);

    ctx.cw20 = results.cw20Input;
    ctx.network = results.network;
    ctx.tokenType = results.tokenType;
    ctx.tokenSymbol = results.tokenSymbol;
    ctx.decimals = results.decimals;
  } catch (e) {
    // Notify the channel with whatever went wrong in this step
    return await res.error(e);
  }

  await interaction.reply({
    embeds: [
      createEmbed({
        title: 'How many tokens?',
        description: 'Please enter the number of tokens a user must have to get a special role.',
        footer: 'Note: this role will be created automatically',
      }),
    ]
  });

  next(() => 'promptTokenAmount');
}

module.exports = {
  handleCW20Entry,
}
