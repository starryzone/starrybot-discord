// TODO: refactor and code reuse of all files in this dir: nativeToken-<token>
const { createEmbed } = require("../../utils/messages");

async function nativeTokenJUNO(req, res, ctx, next) {
  const { interaction } = req;

  ctx.tokenAddress = 'juno'
  ctx.tokenSymbol = 'juno'
  ctx.network = 'mainnet'

  await interaction.reply({
    embeds: [
      createEmbed({
        title: 'How many native tokens?',
        description: 'Please enter the number of tokens a user must have to get a special role.',
      }),
    ]
  });

  next('promptTokenAmount')
}

module.exports = {
  nativeTokenJUNO
}
