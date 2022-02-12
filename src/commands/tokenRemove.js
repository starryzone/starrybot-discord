const { createEmbed } = require("../utils/messages");

async function starryCommandTokenRemove(req, res, ctx, next) {
  const { interaction } = req;

  if (interaction) {
    await interaction.reply({
      embeds: [
        createEmbed({
          title: 'This feature is a few light years away',
          description: 'Please come back later!'
        })
      ],
      ephemeral: true
    });
  }

  res.done();
}

module.exports = {
  starryCommandTokenRemove: {
    adminOnly: true,
    name: 'remove',
    description: 'Remove token rule',
    execute: starryCommandTokenRemove,
  }
}
