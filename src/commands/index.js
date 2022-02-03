const { SlashCommandBuilder } = require('@discordjs/builders');

const { starryCommandFarewell } = require('./farewell');
const { starryCommandJoin } = require('./join');
const { starryCommandTokenAdd } = require('./tokenAdd');
// TODO: we'll add this in later
// const { starryCommandTokenEdit } = require('./tokenEdit');
const { starryCommandTokenRemove } = require('./tokenRemove');

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

const flattenedCommandMap = {};
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
  // Information about this initiated chain and how it's going
  const req = {
    currentIndex: 0,
    interaction,
    steps: [firstCommandName],
  };
  // Functions for resolving the chain
  const res = {
    done: () => {
      // Send a message saying we're done!
    },
    error: (consoleError, channelError) => {
      // Send a message saying something's gone wrong
      console.warn(consoleError)
      req.interaction.channel.send(channelError || consoleError);
    },
  };
  // A state that can be edited by any step in this chain
  const ctx = {};
  const runner = async (commandName) => {
    const command = flattenedCommandMap[commandName]

    req.currentIndex += 1;
    req.steps.push(commandName);

    if (command) {
      await command(req, res, ctx, commandName => {
        return runner(commandName);
      })
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
}
