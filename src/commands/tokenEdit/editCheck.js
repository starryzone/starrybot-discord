module.exports = {
  editCheck: {
    getConfig: async (args, { db: { roleGet } }) => {
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
              }
            ]
          },
        }
      }
    }
  }
}
