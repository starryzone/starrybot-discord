module.exports = {
  editCheck: {
    getConfig: async (state, { db: { roleGet } }) => {
      const { guildId, userInput: selectedRole } = state;

      // Make sure we recognize the selected role
      const role = await roleGet(guildId, selectedRole);
      if (!role) {
        return {
          error: 'Invalid role. Remember: first you copy, then you paste.'
        };
      } else {
        // Save the selection in state for later steps
        state.selectedRoleName = selectedRole;
        state.selectedRole = role;
        return {
          prompt: {
            type: 'button',
            title: `What would you like to edit for ${selectedRole}?`,
            options: [
              {
                next: 'editRoleName',
                label: 'Role Name',
              },
              {
                next: 'editRoleAmount',
                label: 'Role Amount',
              },
              {
                next: 'editRoleStakedOnly',
                label: 'Whether to only count staked tokens',
              }
            ]
          },
        }
      }
    }
  }
}
