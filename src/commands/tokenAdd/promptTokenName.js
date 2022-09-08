module.exports = {
  // TODO: feels like this should be promptRoleName
  promptTokenName: {
    getConfig: async (state) => {
      const selectedRoleName = state.interactionTarget.fields.getTextInputValue('role-name');
      let amountOfTokensNeeded = parseInt(state.interactionTarget.fields.getTextInputValue('token-amount'));

      // TODO: add fix so they can enter .1 instead of 0.1 and have it work
      if (
        !Number.isInteger(amountOfTokensNeeded) ||
        amountOfTokensNeeded <= 0
      ) {
        // Invalid reply
        return {
          error: 'Need a positive number of tokens.',
        };
      }

      // Multiply by the decimals for native and fungible tokens
      if (state.tokenType === 'native' || state.tokenType === 'cw20') {
        console.log('Multiplying by the number of decimals', state.decimals)
        state.minimumTokensNeeded = amountOfTokensNeeded * (10 ** state.decimals)
        console.log('New amount needed', state.minimumTokensNeeded)
      }

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
