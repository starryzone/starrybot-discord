const starryCommandFarewell = require('./farewell.json');
const starryCommandHealth = require('./health.json');
const starryCommandJoin = require('./join.json');
const starryCommandTokenAdd = require('./tokenAdd.json');
const starryCommandTokenList = require('./tokenList.json');
const starryCommandTokenEdit = require('./tokenEdit.json');
const starryCommandTokenRemove = require('./tokenRemove.json');
const starryCommandExport = require('./export.json');

const { buildCommandData } = require('../utils/commands');
const { Wizardware } = require("../wizardware");

const wizardware = new Wizardware({});

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
