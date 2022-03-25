const { starryCommandFarewell } = require('./farewell');
const { starryCommandHealth } = require('./health');
const { starryCommandJoin } = require('./join');
const { starryCommandTokenAdd } = require('./tokenAdd');
const { starryCommandTokenList } = require('./tokenList');
const { starryCommandTokenEdit } = require('./tokenEdit');
const { starryCommandTokenRemove } = require('./tokenRemove');

const { memberHasRole } = require('../utils/auth');
const { createEmbed } = require("../utils/messages");

const { buildCommandData, COLORS_BY_MESSAGE_TYPE } = require('../utils/commands');

const globalCommandChains = new Map();
const TIMEOUT_DURATION = 360000; // 6 minutes in milliseconds

const { flattenedCommandMap, commandData } = buildCommandData([
  {
    name: 'token-rule',
    description: 'Do things with your token rules',
    options: [
      starryCommandTokenAdd,
      starryCommandTokenEdit,
      starryCommandTokenList,
      starryCommandTokenRemove
    ]
  },
  starryCommandHealth,
  starryCommandJoin,
  starryCommandFarewell,
]);

async function initiateCommandChain(firstCommandName, interaction) {
  // A state that can be edited by any step in this chain
  const args = {
    interaction,

    guild: interaction.guild,
    guildId: interaction.guildId,
    userId: interaction.user.id,
    commandChainKey: `${interaction.guildId}-${interaction.user.id}`,

    currentIndex: 0,
    steps: [firstCommandName],

    endChain: () => {
      // TO-DO: Would be nice to edit the last message
      // so it's less confusing when we stop responding

      globalCommandChains.delete(args.commandChainKey);
    }
  };
  const runner = async (commandName) => {
    const command = flattenedCommandMap[commandName]

    args.currentIndex += 1;
    args.steps.push(commandName);

    // A way for steps to set constant arg values for
    // other steps downstream (i.e. indicators of which
    // path was taken in a sequence)
    if (command.setArgs) {
      Object.keys(command.setArgs).forEach(
        key => args[key] = command.setArgs[key]
      );
    }

    let cancelTimeout;
    if (command) {
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

      return await command.execute(args, getCommandName => {
        globalCommandChains.set(
          args.commandChainKey,
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
      });
    } else {
      // Reply saying something's gone wrong
      const replyTarget = interaction._emoji ?
        interaction.message :
        interaction;
      await replyTarget.reply({
        embeds: [
          createEmbed({
            color: COLORS_BY_MESSAGE_TYPE.error,
            title: 'Error (star might be in retrograde)',
            description: 'Could not find a matching command',
          })
        ],
        ephemeral: true,
      });
      args.endChain();
    }
  }

  // Pretend this is like a middleware :D
  await runner(firstCommandName);
}

module.exports = {
  starryCommand: {
    data: commandData,
    async execute (interaction) {
      const subcommandName = interaction.options.getSubcommand();
      if (flattenedCommandMap[subcommandName]) {
        await initiateCommandChain(subcommandName, interaction);
      } else {
        await interaction.reply('starrybot does not understand this command.');
      }
    }
  },

  continueCommandChain: async ({sourceAction, user}) => {
    if (globalCommandChains.size === 0) return;

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

    if (globalCommandChains.has(interactionKey)) {
      try {
        const nextCommand = globalCommandChains.get(interactionKey);
        await nextCommand(sourceAction);
      } catch (e) {
        console.warn(e);
        channel.send(`Something went wrong, please try again.`);
      }
    }
  }
}
