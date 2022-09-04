const { SlashCommandBuilder } = require('@discordjs/builders');
const { COLORS_BY_MESSAGE_TYPE, createMessage, createPrivateError } = require("../utils/messages");

function buildCommandExecute(command) {
  return async (state, context, next, end) => {
    const config = command.getConfig ?
      await command.getConfig(state, context) :
      command;

    if (!config) { return; } // might have had error

    const { interactionTarget } = state;

    if (config.error) {
      console.warn(config.error);
      await interactionTarget.reply(
        createPrivateError(
          config.channelError ?
          config.channelError.toString() :
          config.error.toString()
        )
      );
      end();
      return;
    }

    const reply = {
      ephemeral: config.ephemeral,
      content: config.message,
    };

    if (config.prompt) {
      const { type: promptType } = config.prompt;
      const messageColor = COLORS_BY_MESSAGE_TYPE['prompt'];

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

          const getNextCommandNameFromEmoji = ({ reaction }) => {
            const emojiName = reaction?._emoji?.name;
            if(!emojiName) return;
            else {
              // If there is no match, the wizard will keep waiting for user interactions
              // until a valid emoji is selected.
              return config.prompt.options.find(emojiConfig => emojiConfig.emoji === emojiName)?.next;
            }
          }

          // Go to the step designated by the selected emoji's config
          next(getNextCommandNameFromEmoji, 'reaction');
          break;

        case 'button':
          reply.content = config.prompt.title;
          reply.buttons = config.prompt.options.map(buttonConfig => ({
            ...buttonConfig,
            // TODO: eventually I'd like to add this
            // customId: buttonConfig.id ?? buttonConfig.next,
            customId: buttonConfig.next,
            style: buttonConfig.style ||  'PRIMARY'
          }));
          if (config.prompt.description || config.prompt.footer) {
            reply.embeds = [{description: config.prompt.description ?? 'Note:', footer: config.prompt.footer}]
          }
          await interactionTarget.reply(createMessage(reply));
          // Go to the step designated by the clicked button's ID
          next(({ interaction }) => interaction.customId, 'button');
          break;

        case 'input':
        default:
          const { title, description, ...props } = config.prompt;
          reply.embeds = [
          ...(config.embeds || []),
            {
              color: messageColor,
              title,
              description,
              ...props
            }
          ];
          await interactionTarget.reply(createMessage(reply));
          next(config.next, config.prompt?.type);
          break;
      }
    }
    else {
      const messageColor = config.done && COLORS_BY_MESSAGE_TYPE['success'];
      reply.embeds = config.embeds?.map(embedConfig => ({
        ...embedConfig,
        color: messageColor,
      }));

      if (reply.content || reply.embeds?.length > 0) {
        await interactionTarget.reply(createMessage(reply));
      }

      if (config.next) {
        next(config.next, config.prompt?.type);
      } else if (config.done) {
        const { title = 'Finished! 🌟', description, ...props } = config.done;
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
