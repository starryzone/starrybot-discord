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
  starryCommandFarewell,
  starryCommandJoin,
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

module.exports = {
  starryCommand: {
    data: commandData,
    async execute (interaction) {
      const subcommand = interaction.options.getSubcommand();
      if (flattenedCommandMap[subcommand]) {
        return flattenedCommandMap[subcommand](interaction);
      } else {
        interaction.reply('Starrybot does not understand this command.');
      }
    }
  },
}
