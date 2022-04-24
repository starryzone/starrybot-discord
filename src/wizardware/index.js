const { Wizard } = require("./wizard");

class Wizardware {
  activeWizards = new Map();

  dependencies = {};

  registeredSteps = new Map();

  timeoutDuration = 360000;

  constructor({ dependencies, timeoutDuration }) {
    if (dependencies) {
      this.dependencies = Object.assign(this.dependencies, dependencies);
    }

    if (timeoutDuration) {
      this.timeoutDuration = timeoutDuration;
    }
  }

  registerStep(name, definition) {
    this.registeredSteps.set(name, definition);
  }

  async initiate(uniqueKey, commandName, initialState) {
    const newWizard = new Wizard({
      uniqueKey,
      wizardware: this,
    });
    await newWizard.execute(commandName, initialState);
  }

  async continue(uniqueKey, promptType, state) {
    if (!this.activeWizards.has(uniqueKey)) return;
    const wizard = this.activeWizards.get(uniqueKey);

    const { currentPromptType } = wizard;
    if (promptType !== currentPromptType) {
      // The user has not responded with the same type we prompted
      // for (i.e. we're waiting for a reaction and they typed
      // a message instead), so don't do anything for now.
      return;
    }

    const nextStep = typeof wizard.getNextStep === 'string' ?
      wizard.getNextStep :
      await wizard.getNextStep(state);
    await wizard.execute(nextStep, state);
  }

  async end (uniqueKey) {
    this.activeWizards.delete(uniqueKey);
  }
}

module.exports = {
  Wizardware,
}
