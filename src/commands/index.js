const { SlashCommandBuilder } = require('@discordjs/builders');

const { starryCommandFarewell } = require('./farewell');
const { starryCommandJoin } = require('./join');
const { starryCommandTokenAdd } = require('./tokenAdd');
// TODO: we'll add this in later
// const { starryCommandTokenEdit } = require('./tokenEdit');
const { starryCommandTokenRemove } = require('./tokenRemove');
const { starrySteps } = require('./steps');

const { createEmbed } = require("../utils/messages");

const globalCommandChains = new Map();
const TIMEOUT_DURATION = 360000; // 6 minutes in milliseconds

const definedCommands = [
  {
    name: 'token-rule',
    description: 'Do things with your token rules',
    options: [
      starryCommandTokenAdd,
      // starryCommandTokenEdit,
      starryCommandTokenRemove
    ]
  },
  starryCommandJoin,
  starryCommandFarewell,
];

const flattenedCommandMap = starrySteps.reduce(
  (commandMap, step) => {
    return {
      ...commandMap,
      [step.name]: step,
    }
  },
  {}
);
const commandData = buildCommandData();

function registerSubcommand(mainCommand, subcommand) {
  const { name, description, execute } = subcommand;
  mainCommand.addSubcommand(sub => sub.setName(name).setDescription(description));
  flattenedCommandMap[name] = execute;
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
    .setDescription('Use StarryBot (starrybot.xyz)');
  definedCommands.forEach(command => registerCommand(mainCommand, command));
  return mainCommand;
}

async function initiateCommandChain(firstCommandName, interaction) {
  const uniqueCommandChainKey = `${interaction.guildId}-${interaction.user.id}`;
  // Information about this initiated chain and how it's going
  const req = {
    currentIndex: 0,
    interaction,
    steps: [firstCommandName],
  };
  // Functions for resolving the chain
  const res = {
    done: doneMessage => {
      if (doneMessage) {
        interaction.channel.send({
          embeds: [
            createEmbed({
              color: '#7585FF',
              title: 'Finished! 🌟',
              description: doneMessage,
            })
          ]
        });
      }

      globalCommandChains.delete(uniqueCommandChainKey);
    },
    error: (consoleError, channelError) => {
      console.warn(consoleError);
      globalCommandChains.delete(uniqueCommandChainKey);

      // Send a message saying something's gone wrong
      req.interaction.channel.send({
        embeds: [
          createEmbed({
            color: '#be75a4',
            title: 'Error (star might be in retrograde)',
            description: channelError || consoleError,
          })
        ]
      });
    },
    timeout: () => {
      // TO-DO: Would be nice to edit the last message
      // so it's less confusing when we stop responding

      globalCommandChains.delete(uniqueCommandChainKey);
    }
  };
  // A state that can be edited by any step in this chain
  const ctx = {};
  const runner = async (commandName) => {
    const command = flattenedCommandMap[commandName]

    req.currentIndex += 1;
    req.steps.push(commandName);

    let cancelTimeout;
    if (command) {
      return await command(req, res, ctx, getCommandName => {
        globalCommandChains.set(
          uniqueCommandChainKey,
          async interaction => {
            req.interaction = interaction;

            // No need to timeout now
            clearTimeout(cancelTimeout);

            const commandName = getCommandName(interaction);
            await runner(commandName);
          },
        );

        // Timeout if it's taking too long
        cancelTimeout = setTimeout(res.timeout, TIMEOUT_DURATION);
      });
    } else {
      res.error('Could not find a matching command');
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
        await interaction.reply('Starrybot does not understand this command.');
      }
    }
  },

  continueCommandChain: async (sourceAction) => {
    if (globalCommandChains.size === 0) return;

    let interactionKey, channel;
    if (sourceAction._emoji) {
      const { guildId, interaction: { user } } = sourceAction.message;
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
