const { createEmbed } = require("../../utils/messages");

async function daoDao(req, res, ctx, next) {
	const { interaction: { message: { channel } } } = req;
  await channel.send({
    embeds: [
      createEmbed({
        color: '#FDC2A0',
        title: 'Check out DAODAO',
        description: "If you haven't set up a DAO, visit the link above to create a DAO with a governance token.",
        fields: [
          {
            name: '🧑‍🤝‍🧑', // a big space
            value: '☯',
            inline: false,
          },
          {
            name: "Paste your DAODAO URL and we'll take care of the rest!",
            value: "(For example, it'll look something like https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld)",
          }
        ],
        url: 'https://daodao.zone'
      })
    ]
  });
  next(() => 'handleCW20Entry');
}

module.exports = {
  daoDao,
}
