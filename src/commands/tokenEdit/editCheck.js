module.exports = {
  editCheck: {
    name: 'editCheck',
    config: async (args, { db: { roleGet } }) => {
      const { guildId, userInput: selectedRole } = args;

      // Make sure we recognize the selected role
      const role = await roleGet(guildId, selectedRole);
      if (!role) {
        return {
          error: 'Invalid role. Remember: first you copy, then you paste.'
        };
      } else {
        // Save the selection in args for later steps
        args.selectedRoleName = selectedRole;
        args.selectedRole = role;
        return {
          message: `What would you like to edit for ${selectedRole}?`,
          prompt: {
            type: 'button',
            options: [
              {
                next: 'editRoleName',
                label: 'Role Name',
                style: 'PRIMARY',
              },
              {
                next: 'editRoleAmount',
                label: 'Role Amount',
                style: 'PRIMARY',
              }
            ]
          },
        }
      }
    }
  }
}
