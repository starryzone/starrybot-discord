const { memberHasRole } = require('../utils/auth');
const { createPrivateError } = require("../utils/messages");

class Wizard {
  wizardware;
  createdAt;
  uniqueKey;

  // Editable state shared across all the steps
  state;

  // Tracks steps that this wizard has executed
  steps;

  // Tracks number of steps executed
  index;

  // Can time-out a wizard that's lasted too long
  cancelTimeout;

  // Function that will return the next wizard step
  getNextStep;
  // String that describes what type of action we're waiting
  // on the user to take next.
  currentPromptType;

  constructor({ uniqueKey, wizardware }) {
    this.createdAt = Date.now();
    this.wizardware = wizardware;
    this.uniqueKey = uniqueKey;

    this.index = 0;
    this.state = {};
    this.steps = [];
  }

  async execute(commandName, state) {
    const command = this.wizardware.registeredSteps.get(commandName);
    const { interactionTarget } = state;
    if (!command) {
      console.warn('Could not find a matching command');
      await interactionTarget.reply(
        createPrivateError('Could not find a matching command')
      )
      return this.wizardware.end(this.uniqueKey);
    }

    if (this.cancelTimeout) {
      clearTimeout(this.cancelTimeout);
    }

    this.index = this.index + 1;
    this.state = Object.assign(this.state, state);
    this.steps.push(commandName);

    if (command.stateOnEnter) {
      // A way for steps to set constant arg values for
      // other steps downstream (i.e. indicators of which
      // path was taken in a sequence)
      Object.keys(command.stateOnEnter).forEach(
        key => this.state[key] = command.stateOnEnter[key]
      );
    }

    // @to-do: Ideally this shouldn't have any knowledge
    // of Discord or our DB.
    // Verify if the user is allowed to use this step.
    // We'd ordinarily prefer the built-in Discord permission
    // system, but it's a work in progress. See for more info:
    // https://github.com/discord/discord-api-docs/issues/2315
    const allowed = command.adminOnly ?
      await memberHasRole(state.interaction.member, 'admin') :
      true;

    if (allowed) {
      return await command.execute(
        this.state,
        this.wizardware.dependencies,
        (getCommandName, currentPromptType) => {
          this.getNextStep = getCommandName;
          this.currentPromptType = currentPromptType;
          this.wizardware.activeWizards.set(this.uniqueKey, this);

          // Timeout if it's taking too long
          this.cancelTimeout = setTimeout(
            () => this.end(),
            this.wizardware.timeoutDuration
          );
        },
        () => this.end(),
      )
    }
    else {
      console.warn('Canceling a wizard from insufficient permissions');
      await interactionTarget.reply(
        createPrivateError('Sorry, you must be an admin to use this command :/')
      )
      return this.wizardware.end(this.uniqueKey);
    }
  }

  async end() {
    if (this && this.wizardware) {
      this.wizardware.end(this.uniqueKey);
    }
  }
}

module.exports = {
  Wizard,
}
