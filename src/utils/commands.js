const { SlashCommandBuilder } = require('discord.js');
const {
  COLORS_BY_MESSAGE_TYPE,
  createMessage,
  createModal,
  createPrivateError,
  createSelectMenu,
} = require("../utils/messages");

async function respond(interactionTarget, contents) {
  try {
    if (interactionTarget.deferred) {
      return interactionTarget.editReply(contents);
    } else {
      return interactionTarget.reply(contents);
    }
  } catch {
    // if for some reason we're unable to reply to the original interaction,
    // we still want people to know something went wrong with this command
    return interactionTarget.channel.send(contents);
  }
}

function buildCommandExecute(command) {
  return async (state, context, next, end) => {
    const { interactionTarget } = state;
    const asyncCommand = command.getConfig !== undefined;

    // As long as the command doesn't explicitly want to disable deferReply (i.e. if they
    // ultimately open a modal) and deferReply exists on the interactionTarget,
    // we want to defer the reply before we call command.getConfig so we can take more
    // than 3 seconds. For more information on the modal limit, see:
    // https://discordjs.guide/interactions/modals.html#building-and-responding-with-modals
    if (command.deferReply !== false && interactionTarget.deferReply) {
      try {
        await interactionTarget.deferReply({ ephemeral: command.ephemeral });
      } catch {
        // If this fails for some reason, we can try to let the rest of the command proceed
        // as if it were undeferred.
      }
    }

    let config;
    try {
      config = command.getConfig ?
        await command.getConfig(state, context) :
        command;
    } catch (error) {
      // If the getConfig function itself crashed for some reason,
      // we'd still like to surface the information
      config = { error };
    }

    // No idea if this is still possible, but we can back out early if so
    if (!config) { return; }

    if (config.error) {
      console.warn(config.error);
      const reply = createPrivateError(
        config.channelError ?
        config.channelError.toString() :
        config.error.toString()
      )
      respond(interactionTarget, reply);

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
          const reactionReply = createMessage(
            {
            embeds: [{
              color: messageColor,
              title: 'One moment…',
              description: 'Loading choices, fren.',
            }],
            // Necessary in order to react to the message
            fetchReply: true,
            ephemeral: config.ephemeral
          })
          let msg = await respond(interactionTarget, reactionReply);
          for (let i = 0; i < config.prompt.options.length; i++) {
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
            ephemeral: config.ephemeral
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
            // This OR statement allows us to support 2 configurations: either each button
            // picks which step it goes to, or the buttons always navigate to the same
            // next step (and that step is responsible for extracting which button was
            // pressed for their own use). If using the latter, we currently require
            // each step to have a unique identifiable value, as discord requires
            // customIds to be unique.
            customId: buttonConfig.next || buttonConfig.value,
            style: buttonConfig.style ||  'Primary'
          }));
          if (config.prompt.description || config.prompt.footer) {
            reply.embeds = [{description: config.prompt.description ?? 'Note:', footer: config.prompt.footer}]
          } else if (config.prompt.embeds) {
            reply.embeds = config.prompt.embeds;
          }
          await respond(interactionTarget, createMessage(reply));

          // If every button should go to the same step, go there. Otherwise,
          // go to the step designated by the clicked button's ID
          next(({ interaction }) => config.next || interaction.customId, 'button');
          break;

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

          await respond(interactionTarget, selectMenu);

          // This OR statement allows us to support 2 configurations: either the select
          // menu always navigates to the same next step (and that step is responsible
          // for extracting the selection for their own use), or each option in the
          // select menu can define which step it wants to go to instead. If using the
          // latter, we currently require each step to go to a unique step, as discord
          // requires values to be unique.
          next(({ interaction }) => config.next || interaction.values?.[0], 'select');
          break;

        case 'modal':
          const modal = createModal({
            title: config.prompt.title,
            embeds: config.embeds,
            inputs: config.prompt?.inputs || [
              {
                label: config.label || 'Enter here'
              }
            ]
          })
          await interactionTarget.showModal(modal);
          next(config.next, config.prompt?.type);
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
          await respond(interactionTarget, createMessage(reply));
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
        await respond(interactionTarget, createMessage(reply));
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
        await respond(interactionTarget, embed);

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
