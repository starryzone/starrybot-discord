const { starryCommandFarewell } = require('./farewell');
const { starryCommandHealth } = require('./health');
const { starryCommandJoin } = require('./join');
const { starryCommandTokenAdd } = require('./tokenAdd');
const { starryCommandTokenList } = require('./tokenList');
const { starryCommandTokenEdit } = require('./tokenEdit');
const { starryCommandTokenRemove } = require('./tokenRemove');

const { buildCommandData } = require('../utils/commands');
const { createPrivateError } = require("../utils/messages");
const { WizardController } = require("../wizardware");

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

const wizardController = new WizardController({
  flattenedWizardSteps: flattenedCommandMap,
  handleError: createPrivateError,
})

module.exports = {
  wizardController,

  starryCommand: {
    data: commandData,
    async execute (interaction) {
      const subcommandName = interaction.options.getSubcommand();
      if (flattenedCommandMap[subcommandName]) {
        await wizardController.initiate(
          `${interaction.guildId}-${interaction.user.id}`,
          subcommandName,
          {
            interaction,
            guild: interaction.guild,
            guildId: interaction.guildId,
            userId: interaction.user.id,
          },
        );
      } else {
        await interaction.reply('starrybot does not understand this command.');
      }
    }
  },
}
