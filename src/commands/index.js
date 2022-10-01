const { starryCommandFarewell } = require('./farewell');
const starryCommandHealth = require('./health.json');
const starryCommandJoin = require('./join.json');
const { starryCommandTokenAdd } = require('./tokenAdd');
const starryCommandTokenList = require('./tokenList.json');
const { starryCommandTokenEdit } = require('./tokenEdit');
const { starryCommandTokenRemove } = require('./tokenRemove');
const starryCommandExport = require('./export.json');

const { buildCommandData } = require('../utils/commands');
const { Wizardware } = require("../wizardware");
console.log(starryCommandJoin);
// Useful dependencies to inject through the steps
const astrolabe = require("../astrolabe");
const daodao = require("../astrolabe/daodao");
const db = require("../db");
const logic = require("../logic");
const networks = require("../astrolabe/networks");
const stargaze = require("../astrolabe/stargaze");

const wizardware = new Wizardware({

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
  starryCommandExport,
], wizardware);

module.exports = {
  wizardware,

  starryCommand: {
    data: commandData,
    async execute (interaction) {
      const subcommandName = interaction.options.getSubcommand();
      if (wizardware.registeredSteps.has(subcommandName)) {
        await wizardware.initiate(
          `${interaction.guildId}-${interaction.user.id}`,
          subcommandName,
          {
            interaction,
            // Reply directly to the slash command message
            interactionTarget: interaction,
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
