const { memberHasRole } = require('../utils/auth');
const { createPrivateError } = require("../utils/messages");

// Useful dependencies to inject through the steps
const astrolabe = require("../astrolabe");
const daodao = require("../astrolabe/daodao");
const db = require("../db");
const logic = require("../logic");
const networks = require("../astrolabe/networks");
const stargaze = require("../astrolabe/stargaze");
///

const globalWizards = new Map();
const TIMEOUT_DURATION = 360000; // 6 minutes in milliseconds

async function initiateWizard(firstCommandName, interaction, flattenedCommandMap) {
  // A state that can be edited by any step in this chain
  const args = {
    interaction,

    guild: interaction.guild,
    guildId: interaction.guildId,
    userId: interaction.user.id,
    wizardKey: `${interaction.guildId}-${interaction.user.id}`,

    currentIndex: 0,
    steps: [firstCommandName],

    endChain: () => {
      // TO-DO: Would be nice to edit the last message
      // so it's less confusing when we stop responding

      globalWizards.delete(args.wizardKey);
    }
  };
  const runner = async (commandName) => {
    const command = flattenedCommandMap[commandName]

    args.currentIndex += 1;
    args.steps.push(commandName);

    let cancelTimeout;
    if (command) {
      // A way for steps to set constant arg values for
      // other steps downstream (i.e. indicators of which
      // path was taken in a sequence)
      if (command.updatedArgs) {
        Object.keys(command.updatedArgs).forEach(
          key => args[key] = command.updatedArgs[key]
        );
      }

      // Verify if the user is allowed to use this step.
      // We'd ordinarily prefer the built-in Discord permission
      // system, but it's a work in progress. See for more info:
      // https://github.com/discord/discord-api-docs/issues/2315
      const allowed = command.adminOnly ?
        await memberHasRole(interaction.member, 'admin') :
        true;

      if (!allowed) {
        return {
          error: 'Canceling a command chain from insufficient permissions',
          channelError: 'Sorry, you must be an admin to use this command :/'
        };
      }

      return await command.execute(
        args,
        { astrolabe, daodao, db, logic, networks, stargaze },
        getCommandName => {
          globalWizards.set(
            args.wizardKey,
            async interaction => {
              args.interaction = interaction;
              if(interaction.content) {
                args.userInput = interaction.content;
              }

              // No need to timeout now
              clearTimeout(cancelTimeout);

              const commandName = typeof getCommandName === 'string' ?
                getCommandName : getCommandName(interaction);
              await runner(commandName);
            },
          );

          // Timeout if it's taking too long
          cancelTimeout = setTimeout(args.endChain, TIMEOUT_DURATION);
        }
      );
    } else {
      // Reply saying something's gone wrong
      const replyTarget = interaction._emoji ?
        interaction.message :
        interaction;
      await replyTarget.reply(
        createPrivateError('Could not find a matching command')
      );
      args.endChain();
    }
  }

  // Pretend this is like a middleware :D
  await runner(firstCommandName);
}

module.exports = {
  initiateWizard,

  continueWizard: async ({sourceAction, user}) => {
    if (globalWizards.size === 0) return;

    let interactionKey, channel;
    if (sourceAction._emoji) {
      const { guildId, interaction } = sourceAction.message;

      if (!user) {
        // Check to make sure this isn't an emoji reaction when a text input was expected
        if (!interaction) {
          console.error('Could not determine user for that interaction or reaction.')
          return;
        }
        user = interaction.user
      }
      interactionKey = `${guildId}-${user.id}`;
      channel = sourceAction.message.channel;
    } else {
      const { author, guildId, user } = sourceAction;
      interactionKey = `${guildId}-${user?.id || author?.id}`;
      channel = sourceAction.channel;
    }

    if (globalWizards.has(interactionKey)) {
      try {
        const nextCommand = globalWizards.get(interactionKey);
        await nextCommand(sourceAction);
      } catch (e) {
        console.warn(e);
        channel.send(`Something went wrong, please try again.`);
      }
    }
  }
}
