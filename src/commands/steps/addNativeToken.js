const { createButton, createMessageActionRow } = require("../../utils/messages");
const { networkPrefixes } = require('../../stargate/networks');

// Add native token (like juno, stars…)
async function addNativeToken(req, res, ctx, next) {
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
