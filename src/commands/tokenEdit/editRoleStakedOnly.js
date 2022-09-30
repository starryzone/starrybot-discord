module.exports = {
  editRoleStakedOnly: {
    getConfig: async (state) => {
      const { guild, interactionTarget: { fields }, selectedRole, selectedRoleName } = state;
      // Validate role name selection before continuing
      const newRoleName = fields.getTextInputValue('role-name');
      const existingObjectRoles = await guild.roles.fetch();
      let roleAlreadyExists = existingObjectRoles.some(role => role.name === newRoleName);
      if (roleAlreadyExists) {
        // Invalid reply
        return {
          error: 'A token role already exists with this name. Please pick a different name, or rename that one first.'
        }
      } else {
        state.newRoleName = newRoleName;
      }

      // Validate token amount selection before continuing
      // We only prompt token amount for native and CW20 tokens today
      if (['native', 'cw20'].includes(selectedRole.token_type)) {
        const amountOfTokensNeeded = parseInt(fields.getTextInputValue('token-amount'));
        if (
          !Number.isInteger(amountOfTokensNeeded) ||
          amountOfTokensNeeded <= 0
        ) {
          // Invalid reply
          return {
            error: 'Need a positive number of tokens.'
          }
        }

        // We'll multiply by the decimal before we update it
        state.amountOfTokensNeeded = amountOfTokensNeeded;
      }

      return {
        next: 'handleRoleEdit',
        prompt: {
          type: 'button',
          title: 'Count only staked tokens?',
          description: selectedRole.count_staked_only ?
            `${selectedRoleName} currently counts Staked Tokens only` :
            `${selectedRoleName} currently does NOT count Staked Tokens only`,
          options: [{
            label: 'Yes',
            value: 'yes',
          }, {
            label: 'No, count them all',
            value: 'no',
          }],
          footer: {
            text: selectedRole.count_staked_only ?
            `If you select "No" it will count liquid, staked, and currently unbonding where applicable.\nIf you select "Yes", there will be no change.` :
            `If you select "Yes", it will count staked tokens only.\nIf you select "No", there will be no change.`,
          }
        }
      }
    }
  }
}
