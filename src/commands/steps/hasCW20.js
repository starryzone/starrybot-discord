const { createEmbed } = require("../../utils/messages");

async function hasCW20(req, res, ctx, next) {
	const { interaction: { message: { channel } } } = req;
  await channel.send({
    embeds: [
      createEmbed({
        color: '#FDC2A0',
        title: 'Enter your token address',
        description: 'Please write your cw20 token address in Discord chat…',
      })
    ]
  });
  next(() => 'handleCW20Entry');
}

module.exports = {
  hasCW20,
}
