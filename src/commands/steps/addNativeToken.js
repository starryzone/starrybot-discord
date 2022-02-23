const { createButton, createMessageActionRow } = require("../../utils/messages");
// const { networkInfo } = require('../../utils/networks')


// Add native token (like juno, stars…)
async function addNativeToken(req, res, ctx, next) {
  // TODO: figure out why I can't import it, emergency hack
  let networkInfo, networkPrefixes;
  try {
    networkInfo = JSON.parse(process.env.COSMOS_NETWORKS)
    networkPrefixes = Object.keys(networkInfo)
  } catch (e) {
    console.error('Cannot parse COSMOS_NETWORKS environment variable, please ensure that it is set.')
  }

  const { interaction } = req;

  let components = []
  for (const prefix of networkPrefixes) {
    const btn = createButton({
      customId: `nativeToken${prefix.toUpperCase()}`,
      label: prefix.toUpperCase()
    })
    components.push(btn)
  }
  components.push(createButton({
    customId: `nativeTokenSuggestion`,
    label: '🙋🏽 Suggest another!'
  }))

  const row = createMessageActionRow({
    components
  });

  await interaction.message.reply({
    content: 'Please choose from the supported Cosmos chains:',
    components: [row]
  });

  ctx.tokenType = 'native'
  // According to Meow, all native tokens have 6 decimals
  ctx.decimals = 6

  const getCommandName = interaction => {
    return interaction.customId
  }

  next(getCommandName);
}

module.exports = {
  addNativeToken
}
