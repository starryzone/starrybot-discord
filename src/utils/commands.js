const { SlashCommandBuilder } = require('@discordjs/builders');
const { COLORS_BY_MESSAGE_TYPE, createMessage, createPrivateError } = require("../utils/messages");

function buildBasicMessageCommand(configInput) {
  return async (args, next) => {
    const config = typeof configInput === 'object' ?
      configInput : await configInput(args);
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

    const hasButtons = config.buttons?.length > 0;
    const wantsEmoji = config.emojiOptions?.length > 0;

    const reply = {};
    if (hasButtons) {
      reply.buttons = config.buttons.map(buttonConfig => ({
        ...buttonConfig,
        customId: buttonConfig.next,
      }));
    }

    if (wantsEmoji) {
      const msg = await interactionTarget.reply(createMessage(
        {
          embeds: [{
            color: COLORS_BY_MESSAGE_TYPE.prompt,
            title: 'One moment…',
            description: 'Loading choices, fren.',
          }],
          // Necessary in order to react to the message
          fetchReply: true
        })
      );

      for (var i = 0; i < config.emojiOptions.length; i++) {
        await msg.react(config.emojiOptions[i].emoji);
      }

      msg.edit(createMessage({
        embeds: [
          ...(config.embeds || []),
          {
            color: config.messageType ?
              COLORS_BY_MESSAGE_TYPE[config.messageType] :
              config.color,
            title: config.title,
            description: config.emojiOptions.map(emojiConfig => `${emojiConfig.emoji} ${emojiConfig.description}`).join('\n\n'),
          }
        ],
        title: config.title,
      }));

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
        reply.embeds = config.embeds.map(embedConfig => ({
          ...embedConfig,
          color: config.messageType ?
            COLORS_BY_MESSAGE_TYPE[config.messageType] :
            config.color,
        }));
      }

      if (config.ephemeral) {
        reply.ephemeral = true;
      }
      
      if (reply.content || reply.embeds || reply.components) {
        console.log(reply);
        await interactionTarget.reply(createMessage(reply));
      }

      if (hasButtons) {
        next(interaction => interaction.customId);
      } else if (config.next) {
        next(config.next);
      } else {
        if (config.doneMessage) {
          await interactionTarget.reply(createMessage({
            embeds: [
              {
                color: COLORS_BY_MESSAGE_TYPE.success,
                title: 'Finished! 🌟',
                description: config.doneMessage,
              }
            ]
          }));
        }

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
    execute: subcommand.config ? buildBasicMessageCommand(subcommand.config) : subcommand.execute
  };
  
  subcommand.steps?.forEach(step => {
    flattenedCommandMap[step.name] = {
      ...step,
      execute: step.config ? buildBasicMessageCommand(step.config) : step.execute,
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
