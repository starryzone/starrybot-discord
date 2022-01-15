const { Wizard, WizardStep } = require("./wizard.js")

let wizardAddTokenRule = new Wizard();

wizardAddTokenRule.addStep(new WizardStep(
  'messageReactionAdd', // clicked/tapped emoji

))
