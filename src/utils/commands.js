const { SlashCommandBuilder } = require('@discordjs/builders');
const { COLORS_BY_MESSAGE_TYPE, createMessage, createPrivateError } = require("../utils/messages");

/*
 * Types of messages:
 * { content: 'just a single message', ephemeral?: privateOrNot, buttons? }
 * { title: }
 */

function buildBasicMessageCommand(configInput) {
  return async (args, db, next) => {
    const config = typeof configInput === 'object' ?
      configInput : await configInput(args, db);
    if (!config) { return; } // might have had error

    const { interaction } = args;
    // TO-DO: Was the interaction from a slash command,n message
    // or emoji?
    const interactionTarget = interaction.reply ? interaction : interaction.message;

    if (config.error) {
      console.warn(config.error);
      await interactionTarget.reply(
        createPrivateError(
          config.channelError ?
          config.channelError.toString() :
          config.error.toString()
        )
      );
      args.endChain();
      return;
    }

    const promptType = config.prompt?.type;
    let messageColor; // Error message color currently handled separately
    if (promptType) {
      messageColor = COLORS_BY_MESSAGE_TYPE['prompt'];
    } else if (config.done) {
      messageColor = COLORS_BY_MESSAGE_TYPE['success'];
    }

    const reply = {
      ephemeral: config.ephemeral,
      message: config.message,
    };

    switch(promptType) {
      case 'reaction':
        const msg = await interactionTarget.reply(createMessage(
          {
            embeds: [{
              color: messageColor,
              title: 'One moment…',
              description: 'Loading choices, fren.',
            }],
            // Necessary in order to react to the message
            fetchReply: true
          })
        );

        for (var i = 0; i < config.prompt.options.length; i++) {
          await msg.react(config.prompt.options[i].emoji);
        }

        msg.edit(createMessage({
          embeds: [
            ...(config.embeds || []),
            {
              color: messageColor,
              title: config.prompt.title,
              description: config.prompt.options.map(emojiConfig => `${emojiConfig.emoji} ${emojiConfig.description}`).join('\n\n'),
            }
          ],
          title: config.title,
        }));

        const getNextCommandNameFromEmoji = reaction => {
          const emojiName = reaction?._emoji?.name;
          if(!emojiName) return;
          else {
            return config.prompt.options.find(emojiConfig => emojiConfig.emoji === emojiName).next;
          }
        }

        // Go to the step designated by the selected emoji's config
        next(getNextCommandNameFromEmoji);
        break;

      case 'button':
        reply.content = config.prompt.title;
        reply.buttons = config.prompt.options.map(buttonConfig => ({
          ...buttonConfig,
          customId: buttonConfig.next,
        }));
        await interactionTarget.reply(createMessage(reply));
        // Go to the step designated by the clicked button's ID
        next(interaction => interaction.customId);
        break;

      case 'input':
        // TO-DO: add embed for config.prompt.embeds
        reply.embeds = config.embeds?.map(embedConfig => ({
          ...embedConfig,
          color: messageColor,
        }));
        await interactionTarget.reply(createMessage(reply));
        next(config.next);
        break;

      default:
        reply.embeds = config.embeds?.map(embedConfig => ({
          ...embedConfig,
          color: messageColor,
        }));

        if (config.next) {
          next(config.next);
        } else if (config.done) {
          const { title = 'Finished! 🌟', message: description, ...props } = config.done;
          await interactionTarget.reply(createMessage({
            embeds: [
              {
                color: messageColor,
                title,
                description,
                ...props
              }
            ]
          }));
          // Chain is over, clean up
          args.endChain();
        } else {
          // We don't know what to do next, but we're sure
          // as heck not waiting on anything anymore
          args.endChain();
        }
    }
  }
}

function registerSubcommand(flattenedCommandMap, mainCommand, subcommand) {
  const { name, description } = subcommand;
  mainCommand.addSubcommand(sub => sub.setName(name).setDescription(description));
  flattenedCommandMap[name] = {
    ...subcommand,
    execute: subcommand.execute ? subcommand.execute : buildBasicMessageCommand(subcommand.config)
  };
  
  subcommand.steps?.forEach(step => {
    flattenedCommandMap[step.name] = {
      ...step,
      execute: step.execute ? step.execute : buildBasicMessageCommand(step.config),
    }
  });
}

function registerSubcommandGroup(flattenedCommandMap, mainCommand, subcommandGroup) {
  const { name, description, options } = subcommandGroup;
  mainCommand.addSubcommandGroup(subgroup => {
    const subGroup = subgroup.setName(name).setDescription(description);
    options.forEach(opt => registerSubcommand(flattenedCommandMap, subGroup, opt));
    return subGroup;
  });
}

function registerCommand(flattenedCommandMap, mainCommand, command) {
  if (command.options) {
    registerSubcommandGroup(flattenedCommandMap, mainCommand, command);
  } else {
    registerSubcommand(flattenedCommandMap, mainCommand, command);
  }
}

function buildCommandData(definedCommands) {
  const mainCommand = new SlashCommandBuilder()
    .setName('starry')
    .setDescription('Use starrybot (starrybot.xyz)');
  const flattenedCommandMap = {};
  definedCommands.forEach(command => registerCommand(flattenedCommandMap, mainCommand, command));
  return {
    flattenedCommandMap,
    commandData: mainCommand
  };
}

module.exports = {
  buildBasicMessageCommand,
  buildCommandData,

  COLORS_BY_MESSAGE_TYPE,
}
