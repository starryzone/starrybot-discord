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
    .setDescription('Use starrybot (starrybot.xyz)');
  definedCommands.forEach(command => registerCommand(mainCommand, command));
  return mainCommand;
}

async function initiateCommandChain(firstCommandName, interaction) {
  // Unique key for our globalCommandChain map so that discord users
  // can only have one active chain at a time per guild
  const uniqueCommandChainKey = `${interaction.guildId}-${interaction.user.id}`;
  // Information about this initiated chain and how it's going
  const req = {
    currentIndex: 0,
    interaction,
    steps: [firstCommandName],
  };
  // Functions for resolving the chain
  const res = {
    done: async doneMessage => {
      if (doneMessage) {
        await interaction.channel.send({
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
    error: async (consoleError, channelError) => {
      console.warn(consoleError);
      globalCommandChains.delete(uniqueCommandChainKey);

      // Send a message saying something's gone wrong
      await req.interaction.channel.send({
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
  // The pattern is from (places like) here:
  // https://muniftanjim.dev/blog/basic-middleware-pattern-in-javascript/
  // We'll never call runner directly
  const runner = async (commandName) => {
    const command = flattenedCommandMap[commandName]

    req.currentIndex += 1;
    req.steps.push(commandName);

    let cancelTimeout;
    if (command) {
      // getCommandName should be a function that takes
      // an interaction object and returns the name of the
      // subcommand that's next in this chain
      const next = getCommandName => {
        // Tell the globalCommandChain how to find the
        // next command/step to run when the user interacts
        // with us again
        globalCommandChains.set(
          uniqueCommandChainKey,
          // Call this function when the user next interacts
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
      }

      // Actually executing the command/step functionality
      return await command(req, res, ctx, next);
    } else {
      await res.error('Could not find a matching command');
    }
  }

  // Pretend this is like a middleware :D
  // ^ i love you, boo
  await runner(firstCommandName);
}

module.exports = {
  starryCommand: {
    data: commandData,
    async execute(interaction) {
      const subcommandName = interaction.options.getSubcommand();
      if (flattenedCommandMap[subcommandName]) {
        await initiateCommandChain(subcommandName, interaction);
      } else {
        await interaction.reply('starrybot does not understand this command.');
      }
    }
  },

  continueCommandChain: async (sourceAction) => {
    // If no one has a wizard, don't worry about it
    if (globalCommandChains.size === 0) return;

    let interactionKey, channel;
    // Based on the type of action this was,
    // get the interactionKey and channel info
    if (sourceAction._emoji) {
      const { guildId, interaction } = sourceAction.message;
      // Check to make sure this isn't an emoji reaction when a text input was expected
      if (!interaction) return;
      const user = interaction.user;
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
