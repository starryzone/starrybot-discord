const { starryCommandFarewell } = require('./farewell');
const { starryCommandHealth } = require('./health');
const { starryCommandJoin } = require('./join');
const { starryCommandTokenAdd } = require('./tokenAdd');
const { starryCommandTokenList } = require('./tokenList');
const { starryCommandTokenEdit } = require('./tokenEdit');
const { starryCommandTokenRemove } = require('./tokenRemove');

const { buildCommandData } = require('../utils/commands');

const { initiateWizard } = require("../wizardware");
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

module.exports = {
  starryCommand: {
    data: commandData,
    async execute (interaction) {
      const subcommandName = interaction.options.getSubcommand();
      if (flattenedCommandMap[subcommandName]) {
        await initiateWizard(subcommandName, interaction, flattenedCommandMap);
      } else {
        await interaction.reply('starrybot does not understand this command.');
      }
    }
  },
}
