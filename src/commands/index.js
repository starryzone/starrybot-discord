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

// Useful dependencies to inject through the steps
const astrolabe = require("../astrolabe");
const daodao = require("../astrolabe/daodao");
const db = require("../db");
const logic = require("../logic");
const networks = require("../astrolabe/networks");
const stargaze = require("../astrolabe/stargaze");

const wizardController = new WizardController({
  // How we want errors thrown by the wizard to be handled
  handleError: createPrivateError,

  // Dependencies that each step should have access to
  dependencies: {
    astrolabe,
    daodao,
    db,
    logic,
    networks,
    stargaze
  }
})

const commandData = buildCommandData([
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
], wizardController);

module.exports = {
  wizardController,

  starryCommand: {
    data: commandData,
    async execute (interaction) {
      const subcommandName = interaction.options.getSubcommand();
      if (wizardController.registeredSteps.has(subcommandName)) {
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
