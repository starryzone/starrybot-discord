const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { networkInfo } = require('../../logic')
const JUNO_TESTNET_RPC_ENDPOINT = networkInfo.juno.testnet
const JUNO_MAINNET_RPC_ENDPOINT = networkInfo.juno.mainnet

const { checkForCW20, checkForDAODAODAO } = require("../../token");
const { createEmbed } = require("../../utils/messages");

async function handleCW20Entry(req, res, ctx, next) {
	const { interaction } = req;

  // Check to see if they pasted a DAODAO URL like this:
  // https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld
  let network = 'mainnet'
  let cw20Input, tokenInfo, cosmClient, daoInfo

  const userInput = interaction.content;
  // If user has done something else (like emoji reaction) do nothing
  if (!userInput) return;

  try {
    const daodaoRegex = /^https:\/\/(testnet\.)?daodao.zone/;
    if (userInput.match(daodaoRegex)) {
      network = userInput.includes('testnet') ? 'testnet' : 'mainnet';
      cosmClient = network === 'mainnet' ?
        await CosmWasmClient.connect(JUNO_MAINNET_RPC_ENDPOINT) :
        await CosmWasmClient.connect(JUNO_TESTNET_RPC_ENDPOINT);
      // Exit a failed state more gracefully on mainnet
      const gracefulExit = network === 'mainnet';
      daoInfo = await checkForDAODAODAO(cosmClient, userInput, gracefulExit);
      // If there isn't a governance token associated with this DAO, fail with message
      if (!daoInfo || !daoInfo.hasOwnProperty('gov_token')) {
        // This will be caught in our own catch below
        throw "We couldn't find any governance token associated with your DAO :/\nPerhaps destroyed in a supernova?";
      }
      cw20Input = daoInfo['gov_token']
      // Now that we have the cw20 token address and network, get the info we want
      tokenInfo = await checkForCW20(cosmClient, cw20Input, false)
    } else {
      // Check user's cw20 token for existence on mainnet then testnet
      cw20Input = userInput;
      cosmClient = await CosmWasmClient.connect(JUNO_MAINNET_RPC_ENDPOINT)
      tokenInfo = await checkForCW20(cosmClient, cw20Input, true)
      if (tokenInfo === false) {
        // Nothing was found on mainnet, try testnet
        network = 'testnet'
        cosmClient = await CosmWasmClient.connect(JUNO_TESTNET_RPC_ENDPOINT)
        tokenInfo = await checkForCW20(cosmClient, cw20Input, false)
      }
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
