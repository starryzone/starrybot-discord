const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromToken } = require('../../utils/networks')
const { getDaoDaoTokenDetails } = require("../../stargate/daodao");
const { getCW20TokenDetails } = require("../../stargate/cw20");
const { createEmbed } = require("../../utils/messages");

async function handleCW20Entry(req, res, ctx, next) {
	const { interaction } = req;

  // Check to see if they pasted a DAODAO URL like this:
  // https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld
  let network = 'mainnet'
  let cw20Input, tokenInfo, cosmClient, daoInfo, rpcEndpoint

  const userInput = interaction.content;
  // If user has done something else (like emoji reaction) do nothing
  if (!userInput) return;

  try {
    const daodaoRegex = /^https:\/\/(testnet\.)?daodao.zone/;
    if (userInput.match(daodaoRegex)) {
      const results = await getDaoDaoTokenDetails(userInput);
      network = results.network;
      cw20Input = results.cw20Input;
      tokenType = results.tokenType;
      tokenInfo = results.tokenInfo;
    } else {
      const results = await getCW20TokenDetails(userInput);
      network = results.network;
      cw20Input = results.cw20Input;
      tokenType = results.tokenType;
      tokenInfo = results.tokenInfo;
    }
  } catch (e) {
    // Notify the channel with whatever went wrong in this step
    return await res.error(e);
  }

  ctx.cw20 = cw20Input;
  ctx.network = network;
  ctx.tokenType = 'cw20';
  // Guard against odd cases where reactions are given where not expected
  if (!tokenInfo) return;
  ctx.tokenSymbol = tokenInfo.symbol;
  ctx.decimals = tokenInfo.decimals;

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
