const { SlashCommandBuilder } = require('discord.js');
const { COLORS_BY_MESSAGE_TYPE, createMessage, createModal, createPrivateError, createSelectMenu } = require("../utils/messages");

function buildCommandExecute(command) {
  return async (state, context, next, end) => {
    const config = command.getConfig ?
      await command.getConfig(state, context) :
      command;

    if (!config) { return; } // might have had error
    const { interactionTarget } = state;
    // If sending a message, this will allow us to have more than 3 seconds to respond
    // If we're expecting to open a modal instead, the modal needs to be the first thing:
    // See: https://discordjs.guide/interactions/modals.html#building-and-responding-with-modals
    if (interactionTarget.deferReply && config.prompt?.type !== 'modal') {
      await interactionTarget.deferReply({ephemeral: command.ephemeral})
    }

    if (config.error) {
      console.warn(config.error);
      const reply = createPrivateError(
        config.channelError ?
        config.channelError.toString() :
        config.error.toString()
      )
      if (interactionTarget.deferReply) {
        await interactionTarget.editReply(reply);
      } else {
        await interactionTarget.reply(reply);
      }
      end();
      return;
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
              title: config.title,
              ephemeral: config.ephemeral,
              options: config.prompt.options.map(option => ({
                label: `${option.emoji} ${option.description}`,
                // TO-DO: Selects let us add more descriptions than just the label, but
                // haven't gone back and updated all the emoji reactions text yet.
                // description: option.description,
                value: option.next,
              }))
            }
          );
          let msg
          if (interactionTarget.deferReply) {
            msg = await interactionTarget.editReply(selectMenu);
          } else {
            msg = await interactionTarget.reply(selectMenu);
          }

          next(({ interaction}) => interaction.values?.[0], 'select');
          break;

        case 'button':
          reply.content = config.prompt.title;
          reply.buttons = config.prompt.options.map(buttonConfig => ({
            ...buttonConfig,
            // TODO: eventually I'd like to add this
            // customId: buttonConfig.id ?? buttonConfig.next,
            customId: buttonConfig.next,
            style: buttonConfig.style ||  'Primary'
          }));
          if (config.prompt.description || config.prompt.footer) {
            reply.embeds = [{description: config.prompt.description ?? 'Note:', footer: config.prompt.footer}]
          }
          if (interactionTarget.deferReply) {
            await interactionTarget.editReply(createMessage(reply));
          } else {
            await interactionTarget.reply(createMessage(reply));
          }
          // Go to the step designated by the clicked button's ID
          next(({ interaction }) => interaction.customId, 'button');
          break;

        case 'modal':
        default:
          const { title, description, ...props } = config.prompt;
          // reply.embeds = [
          // ...(config.embeds || []),
          //   {
          //     color: messageColor,
          //     title,
          //     description,
          //     ...props
          //   }
          // ];
          const modal = createModal({
            title,
            embeds: config.embeds,
            inputs: [
              {
                label: config.label || 'Enter here' //description is currently too long,
              }
            ]
          })
          console.log(interactionTarget);
          await interactionTarget.showModal(modal);
          // if (interactionTarget.deferReply) {
          //   await interactionTarget.editReply(createMessage(reply));
          // } else {
          //   await interactionTarget.reply(createMessage(reply));
          // }
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
        if (interactionTarget.deferReply) {
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
        if (interactionTarget.deferReply) {
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
