const { createButton, createMessageActionRow, createEmbed } = require("../utils/messages");

function buildBasicMessageCommand(configInput) {
  return async (req, res, ctx, next) => {
    const config = typeof configInput === 'object' ?
      configInput : await configInput(req, res, ctx, next);
    if (!config) { return; } // might have had error
    const { interaction } = req;
    const hasButtons = config.buttons?.length > 0;
    const wantsEmoji = config.emojiOptions?.length > 0;


    // TO-DO: Was the interaction from a slash command, message
    // or emoji?
    const interactionTarget = interaction.reply ? interaction : interaction.message;

    const reply = {};
    if (hasButtons) {
      const row = createMessageActionRow({
        components: config.buttons.map(buttonConfig => createButton(buttonConfig))
      });
      reply.components = [row];
    }

    if (wantsEmoji) {
      const msgEmbed = createEmbed({
        color: '#FDC2A0',
        title: 'One moment…',
        description: 'Loading choices, fren.',
      })

      const msg = await interactionTarget.reply({
        embeds: [
          msgEmbed
        ],
        // Necessary in order to react to the message
        fetchReply: true
      });

      for (var i = 0; i < config.emojiOptions.length; i++) {
        await msg.react(config.emojiOptions[i].emoji);
      }

      msg.edit({
        embeds: [
          createEmbed({
            color: config.color,
            title: config.title,
            description: config.emojiOptions.map(emojiConfig => `${emojiConfig.emoji} ${emojiConfig.description}`).join('\n\n'),
          })
        ]
      });

      const getCommandName = reaction => {
        const emojiName = reaction?._emoji?.name;
        if(!emojiName) return;
        else {
          return config.emojiOptions.find(emojiConfig => emojiConfig.emoji === emojiName).next;
        }
      }

      // Passing in an event handler for the user's interactions into next
      next(getCommandName);

    } else {
      if (config.content) {
        reply.content = config.content;
      }

      if (config.embeds) {
        reply.embeds = config.embeds.map(embedConfig => createEmbed(embedConfig));
      }

      if (config.ephemeral) {
        reply.ephemeral = true;
      }
      
      await interactionTarget.reply(reply);

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
}


module.exports = {
  buildBasicMessageCommand,
}
