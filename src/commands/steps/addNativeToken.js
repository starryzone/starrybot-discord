const { createEmbed, createButton, createMessageActionRow } = require("../../utils/messages");
const { networkInfo } = require('../../logic')

// Add native token (like juno, stars…)
async function addNativeToken(req, res, ctx, next) {
  const { interaction } = req;

  const networkPrefixes = Object.keys(networkInfo)

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

  const getCommandName = interaction => {
    return interaction.customId
  }

  next(getCommandName);
  // next(interaction => interaction.customId);
}

module.exports = {
  addNativeToken
}
