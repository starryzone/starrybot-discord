const { SlashCommandBuilder } = require('discord.js');
const { COLORS_BY_MESSAGE_TYPE, createMessage, createModal, createPrivateError, createSelectMenu } = require("../utils/messages");

function buildCommandExecute(command) {
  return async (state, context, next, end) => {
    const config = command.getConfig ?
      await command.getConfig(state, context) :
      command;

    if (!config) { return; } // might have had error

    const { interactionTarget } = state;

    if (config.error) {
      const reply = createPrivateError(
        config.channelError ?
        config.channelError.toString() :
        config.error.toString()
      )
      try {
        await interactionTarget.reply(reply);
      } catch {
        // if for some reason the interaction doesn't exist at this point,
        // we still want people to know something went wrong.
        await interactionTarget.channel.send(reply);
      }

      end();
      return;
    }

    
    // If sending a message, this will allow us to have more than 3 seconds to respond
    // If we're expecting to open a modal instead, the modal needs to be the first thing:
    // See: https://discordjs.guide/interactions/modals.html#building-and-responding-with-modals
    if (interactionTarget.deferReply && config.prompt?.type !== 'modal') {
      // There's a rare, annoying case where this may fail due to "Unknown Interaction".
      // If this happens, we'll just let the message try to send as normal, otherwise
      // the entire bot may crash.
      // See: https://github.com/discordjs/discord.js/issues/7005
      try {
        await interactionTarget.deferReply({ ephemeral: command.ephemeral });
      } catch (e) {}
    }

    const reply = {
      ephemeral: config.ephemeral,
      content: config.message,
    };

    if (config.prompt) {
      const { type: promptType } = config.prompt;

      switch(promptType) {
        case 'select':
          const selectMenu = createSelectMenu(
            {
              title: config.prompt.title,
              ephemeral: config.ephemeral,
              embeds: config.prompt.embeds,
              options: config.prompt.options.map(option => ({
                label: option.label || `${option.emoji} ${option.description}`,
                // TO-DO: Selects let us add more descriptions than just the label, but
                // haven't gone back and updated all the emoji reactions text yet.
                description: option.description,
                value: option.value || option.next,
              }))
            }
          );
          let msg
          if (interactionTarget.deferred) {
            msg = await interactionTarget.editReply(selectMenu);
          } else {
            msg = await interactionTarget.reply(selectMenu);
          }

          next(({ interaction }) => config.next || interaction.values?.[0], 'select');
          break;

        case 'button':
          reply.content = config.prompt.title;
          reply.buttons = config.prompt.options.map(buttonConfig => ({
            ...buttonConfig,
            // TODO: eventually I'd like to add this
            // customId: buttonConfig.id ?? buttonConfig.next,
            customId: buttonConfig.next || buttonConfig.value,
            style: buttonConfig.style ||  'Primary'
          }));
          if (config.prompt.description || config.prompt.footer) {
            reply.embeds = [{description: config.prompt.description ?? 'Note:', footer: config.prompt.footer}]
          } else if (config.embeds) {
            reply.embeds = config.embeds;
          }
          if (interactionTarget.deferred) {
            await interactionTarget.editReply(createMessage(reply));
          } else {
            await interactionTarget.reply(createMessage(reply));
          }
          // Go to the step designated by the clicked button's ID
          next(({ interaction }) => config.next || interaction.customId, 'button');
          break;

        case 'modal':
        default:
          const { title, description, inputs, ...props } = config.prompt;
          const modal = createModal({
            title,
            embeds: config.embeds,
            inputs: inputs || [
              {
                label: config.label || 'Enter here'
              }
            ]
          })
          await interactionTarget.showModal(modal);
          next(config.next, config.prompt?.type);
          break;
      }
    } else {
      const messageColor = config.done && COLORS_BY_MESSAGE_TYPE['success'];
      reply.embeds = config.embeds?.map(embedConfig => ({
        ...embedConfig,
        color: messageColor,
      }));

      if (reply.content || reply.embeds?.length > 0) {
        if (interactionTarget.deferred) {
          await interactionTarget.editReply(createMessage(reply));
        } else {
          await interactionTarget.reply(createMessage(reply));
        }
      }

      if (config.next) {
        next(config.next, config.prompt?.type);
      } else if (config.done) {
        const { title = 'Finished! 🌟', description, ...props } = config.done;
        let embed = createMessage({
          embeds: [
            {
              color: messageColor,
              title,
              description,
              ...props
            },
          ],
          ephemeral: reply.ephemeral,

        })
        if (props.attachments) {
          embed.files = props.attachments
        }
        if (interactionTarget.deferred) {
          await interactionTarget.editReply(embed);
        } else {
          await interactionTarget.reply(embed);
        }
        // Chain is over, clean up
        end();
      } else {
        // We don't know what to do next, but we're sure
        // as heck not waiting on anything anymore
        end();
      }
    }
  }
}

function registerSubcommand(wizardware, mainCommand, subcommand) {
  const { adminOnly, name, description } = subcommand;
  mainCommand.addSubcommand(
    sub => sub
      .setName(name)
      .setDescription(`${adminOnly ? '(Admin only) ': ''}${description}`)
  );
  wizardware.registerStep(name, {
    ...subcommand,
    execute: subcommand.execute ? subcommand.execute : buildCommandExecute(subcommand)
  });

  if (subcommand.steps) {
    Object.entries(subcommand.steps).forEach(([ name, step ]) => {

      wizardware.registerStep(name, {
        ...step,
        name,
        execute: step.execute ? step.execute : buildCommandExecute(step),
      });
    });
  }
}

function registerSubcommandGroup(wizardware, mainCommand, subcommandGroup) {
  const { adminOnly, name, description, options } = subcommandGroup;
  mainCommand.addSubcommandGroup(subgroup => {
    const subGroup = subgroup
      .setName(name)
      .setDescription(`${adminOnly ? '(Admin only) ': ''}${description}`);
    options.forEach(opt => registerSubcommand(wizardware, subGroup, opt));
    return subGroup;
  });
}

function registerStep(wizardware, mainCommand, command) {
  if (command.options) {
    registerSubcommandGroup(wizardware, mainCommand, command);
  } else {
    registerSubcommand(wizardware, mainCommand, command);
  }
}

function buildCommandData(definedCommands, wizardware) {
  const mainCommand = new SlashCommandBuilder()
    .setName('starry')
    .setDescription('Use starrybot (starrybot.xyz)');
  definedCommands.forEach(command => registerStep(wizardware, mainCommand, command));
  return mainCommand;
}

module.exports = {
  buildCommandData,

  COLORS_BY_MESSAGE_TYPE,
}
