const { RoleListWizardConfig } = require("../wizard/role-list");
const { Wizard } = require("../wizard/wizard");
const { globalUserWizards } = require("../wizard/wizard");

async function starryCommandRoleList(interaction, client) {
  const userId = interaction.user.id;

  let roleListWizard = new Wizard(
    RoleListWizardConfig,
    interaction.guildId,
    interaction.channelId,
    userId,
    client
  )

  // Begin the wizard by calling the begin function on the first step
  const msg = await roleListWizard.currentStep.beginFn({ interaction });

  // Let the next step know this message so we can reply to it
  roleListWizard.currentStep.setMessageId(msg.id);

  // Set the in-memory Map
  globalUserWizards.set(`${interaction.guildId}-${userId}`, roleListWizard)
}

module.exports = {
  starryCommandRoleList
}
