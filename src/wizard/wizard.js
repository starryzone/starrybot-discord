class WizardStep {
  messageId;
  currentOption = []; // keys to the option step(s), empty for no options
  optionSteps = {}; // non-sequential
  interactionType;
  // returns something like
  // {
  //   proceed: true,
  //   proceedType: 'option'/'step',
  //   proceedKey: 'ask-cw20'/2 (index of step),
  //   messageEmbed: <Discord object> or null
  // }
  resultFn;

  constructor(interactionType, resultFn) {
    this.interactionType = interactionType
    this.resultFn = resultFn
  }

  addOptionStep(key, wizardStep) {
    this.optionSteps[key] = wizardStep
  }

  processResult(result) {
    if (result.proceed === false) {
      // User has made interaction that stops wizard process

    }
  }
}

class Wizard {
  discordUserId;
  steps = []; // sequential
  currentStep = 0;
  createdAt;

  constructor() {
    this.createdAt = Date.now()
  }

  addStep(wizardStep) {
    this.steps.push(wizardStep)
  }
}

module.exports = {
  WizardStep,
  Wizard
}
