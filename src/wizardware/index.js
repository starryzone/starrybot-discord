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

  async continue(uniqueKey, state) {
    if (!this.activeWizards.has(uniqueKey)) return;
    const wizard = this.activeWizards.get(uniqueKey);
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
