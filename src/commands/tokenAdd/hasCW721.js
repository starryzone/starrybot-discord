const { createEmbed } = require("../../utils/messages");

async function hasCW721(req, res, ctx, next) {
  const { interaction: { message: { channel } } } = req;
  await channel.send({
    embeds: [
      createEmbed({
        color: '#FDC2A0',
        title: "Enter the token address",
        description: "Please write the cw721 token address in Discord chat…",
      })
    ]
  });
  next(() => 'handleCW721Entry');
}

module.exports = {
  hasCW721,
}
