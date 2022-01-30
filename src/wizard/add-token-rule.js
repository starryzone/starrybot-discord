const { Wizard } = require("./wizard.js")
const { createStep1 } = require("./add-token-rule/steps/step1");
const { createStep2 } = require("./add-token-rule/steps/step2");

class WizardAddTokenRule extends Wizard {
  constructor(guildId, channelId, userId, client) {
    super();
    // Add first step (getting the cw20 address)
    let step = createStep1(userId, this)
    this.addStep(step)
    // Add second step (input how many of these tokens the user needs, add to db)
    step = createStep2(userId, this)
    this.addStep(step)
    this.currentStep = this.steps[0]
    this.discordUserId = userId
    this.channelId = channelId
    this.guildId = guildId
    this.client = client
  }
}

module.exports = { WizardAddTokenRule }
