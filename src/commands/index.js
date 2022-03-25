const { SlashCommandBuilder } = require('@discordjs/builders');

const { starryCommandFarewell } = require('./farewell');
const { starryCommandHealth } = require('./health');
const { starryCommandJoin } = require('./join');
const { starryCommandTokenAdd } = require('./tokenAdd');
const { starryCommandTokenList } = require('./tokenList');
const { starryCommandTokenEdit } = require('./tokenEdit');
const { starryCommandTokenRemove } = require('./tokenRemove');

const { memberHasRole } = require('../utils/auth');
const { createEmbed } = require("../utils/messages");

const { buildBasicMessageCommand } = require('../utils/commands');

const globalCommandChains = new Map();
const TIMEOUT_DURATION = 360000; // 6 minutes in milliseconds

const definedCommands = [
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
];

const flattenedCommandMap = [];
const commandData = buildCommandData();

function registerSubcommand(mainCommand, subcommand) {
  const { name, description } = subcommand;
  mainCommand.addSubcommand(sub => sub.setName(name).setDescription(description));
  flattenedCommandMap[name] = {
    ...subcommand,
    execute: subcommand.config ? buildBasicMessageCommand(subcommand.config) : subcommand.execute
  };
  
  subcommand.steps?.forEach(step => {
    flattenedCommandMap[step.name] = {
      name: step.name,
      execute: step.config ? buildBasicMessageCommand(step.config) : step.execute,
    }
  });
}

function registerSubcommandGroup(mainCommand, subcommandGroup) {
  const { name, description, options } = subcommandGroup;
  mainCommand.addSubcommandGroup(subgroup => {
    const subGroup = subgroup.setName(name).setDescription(description);
    options.forEach(opt => registerSubcommand(subGroup, opt));
    return subGroup;
  });
}

function registerCommand(mainCommand, command) {
  if (command.options) {
    registerSubcommandGroup(mainCommand, command);
  } else {
    registerSubcommand(mainCommand, command);
  }
}

function buildCommandData() {
  const mainCommand = new SlashCommandBuilder()
    .setName('starry')
    .setDescription('Use starrybot (starrybot.xyz)');
  definedCommands.forEach(command => registerCommand(mainCommand, command));
  return mainCommand;
}

async function initiateCommandChain(firstCommandName, interaction) {
  // Information about this initiated chain and how it's going
  const req = {
    currentIndex: 0,
    interaction,
    steps: [firstCommandName],
  };
  // A state that can be edited by any step in this chain
  const ctx = {
    guildId: interaction.guildId,
    userId: interaction.user.id,
    commandChainKey: `${interaction.guildId}-${interaction.user.id}`,

    endChain: () => {
      // TO-DO: Would be nice to edit the last message
      // so it's less confusing when we stop responding

      globalCommandChains.delete(ctx.commandChainKey);
    }
  };
  const runner = async (commandName) => {
    const command = flattenedCommandMap[commandName]

    req.currentIndex += 1;
    req.steps.push(commandName);

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

      return await command.execute(req, ctx, getCommandName => {
        globalCommandChains.set(
          ctx.commandChainKey,
          async interaction => {
            req.interaction = interaction;

            // No need to timeout now
            clearTimeout(cancelTimeout);

            const commandName = typeof getCommandName === 'string' ?
              getCommandName : getCommandName(interaction);
            await runner(commandName);
          },
        );

        // Timeout if it's taking too long
        cancelTimeout = setTimeout(ctx.endChain, TIMEOUT_DURATION);
      });
    } else {
      // Reply saying something's gone wrong
      const replyTarget = req.interaction._emoji ?
        req.interaction.message :
        req.interaction;
      await replyTarget.reply({
        embeds: [
          createEmbed({
            color: '#be75a4',
            title: 'Error (star might be in retrograde)',
            description: 'Could not find a matching command',
          })
        ],
        ephemeral: true,
      });
      ctx.endChain();
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
