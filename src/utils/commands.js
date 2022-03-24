const { createButton, createMessageActionRow } = require("../utils/messages");

function buildBasicMessageCommand(config) {
  return async (req, res, ctx, next) => {
    const { interaction } = req;
    const hasButtons = config.buttons?.length > 0;

    let row;
    if (hasButtons) {
      row = createMessageActionRow({
        components: config.buttons.map(buttonConfig => createButton(buttonConfig))
      });
    }

    await interaction.reply({
      content: config.content,
      components: [
        ...([row] || [])
      ]
    });

    if (hasButtons) {
      next(interaction => interaction.customId);
    }
  }
}


module.exports = {
  buildBasicMessageCommand,
}
