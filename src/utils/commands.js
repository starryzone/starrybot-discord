const { createButton, createMessageActionRow, createEmbed } = require("../utils/messages");

function buildBasicMessageCommand(configInput) {
  return async (req, res, ctx, next) => {
    const config = typeof configInput === 'object' ?
      configInput : await configInput(req, res, ctx, next);
    const { interaction } = req;
    const hasButtons = config.buttons?.length > 0;

    const reply = {};
    if (hasButtons) {
      const row = createMessageActionRow({
        components: config.buttons.map(buttonConfig => createButton(buttonConfig))
      });
      reply.components = [row];
    }

    if (config.content) {
      reply.content = config.content;
    }

    if (config.embeds) {
      reply.embeds = config.embeds.map(embedConfig => createEmbed(embedConfig));
    }

    if (config.ephemeral) {
      reply.ephemeral = true;
    }

    await interaction.reply(reply);

    if (config.done) {
      res.done();
    }
    else if (hasButtons) {
      next(interaction => interaction.customId);
    } else if (config.next) {
      next(config.next);
    }
  }
}


module.exports = {
  buildBasicMessageCommand,
}
