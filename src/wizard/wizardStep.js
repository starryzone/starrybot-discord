class WizardStep {
  parentWizard;
  respondToMessageId; // first step is null, the rest aren't
  optionSteps = {}; // non-sequential
  interactionType; // reaction, text, button
  /*
  beginFn takes an optional interaction and will generally
  send a message, kicking off a prompt
  */
  beginFn;
  /*
  resultFn takes interaction and returns:
  must change the Wizard's currentStep
  and should likely call the currentStep's beginFn
  if it's reached the end of the wizard, call done()
  */
  resultFn;

  constructor(parentWizard, interactionType, respondToMessageId, beginFn, resultFn) {
    this.parentWizard = parentWizard
    this.interactionType = interactionType
    this.respondToMessageId = respondToMessageId
    this.beginFn = beginFn
    this.resultFn = resultFn
  }

  addOptionStep(key, wizardStep) {
    this.optionSteps[key] = wizardStep
  }

  setMessageId(msgId) {
    this.respondToMessageId = msgId
  }
}

module.exports = {
    WizardStep,
}
