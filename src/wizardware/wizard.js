const { memberHasRole } = require('../utils/auth');

class Wizard {
  wizardController;
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

  constructor({ uniqueKey, wizardController }) {
    this.createdAt = Date.now();
    this.wizardController = wizardController;
    this.uniqueKey = uniqueKey;

    this.index = 0;
    this.state = {};
    this.steps = [];
  }

  async execute(commandName, state) {
    const command = this.wizardController.registeredSteps.get(commandName);
    if (!command) {
      return this.error('Could not find a matching command')
    }

    if (this.cancelTimeout) {
      clearTimeout(this.cancelTimeout);
    }

    this.index = this.index + 1;
    this.state = Object.assign(this.state, state);
    this.steps.push(commandName);

    if (command.updatedArgs) {
      // A way for steps to set constant arg values for
      // other steps downstream (i.e. indicators of which
      // path was taken in a sequence)
      Object.keys(command.updatedArgs).forEach(
        key => this.state[key] = command.updatedArgs[key]
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

    if (!allowed) {
      console.warn('Canceling a wizard from insufficient permissions');
      this.wizardController.error(
        this.uniqueKey,
        'Sorry, you must be an admin to use this command :/',
      )
    }

    return await command.execute(
      this.state,
      this.wizardController.dependencies,
      getCommandName => {
        this.getNextStep = getCommandName;
        this.wizardController.activeWizards.set(this.uniqueKey, this);

        // Timeout if it's taking too long
        this.cancelTimeout = setTimeout(
          this.end,
          this.wizardController.timeoutDuration
        );
      },
      this.end,
    )
  }

  async end() {
    if (this) {
      this.wizardController.end(this.uniqueKey);
    }
  }
}

module.exports = {
  Wizard,
}
