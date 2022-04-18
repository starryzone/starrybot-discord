module.exports = {
  // TODO: feels like this should be promptRoleName
  promptTokenName: {
    getConfig: async (state) => {
      const selectedRoleName = state.userInput
      const { guild } = state

      const existingObjectRoles = await guild.roles.fetch();
      let roleAlreadyExists = existingObjectRoles.some(role => role.name === selectedRoleName);
      if (roleAlreadyExists) {
        // Invalid reply
        return {
          error: 'A token role already exists with this name. Please pick a different name, or rename that one first.'
        };
      }

      // We can make the new role, set it in state for creation and addition
      //   to database later
      state.selectedRoleName = selectedRoleName

      return {
        prompt: {
          type: 'button',
          title: 'Count only staked tokens?',
          options: [{
            next: 'handleStakedOnlyYes',
            label: 'Yes'
          }, {
            next: 'handleStakedOnlyNo',
            label: 'No, count them all'
          }],
          footer: 'If you select "No" it will count liquid, staked, and currently unbonding where applicable.',
        }
      }
    }
  }
}
