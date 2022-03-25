const { roleGet } = require("../../db");

module.exports = {
  editCheck: {
    name: 'editCheck',
    config: async (ctx) => {
      const { guildId, userInput: selectedRole } = ctx;

      // Make sure we recognize the selected role
      const role = await roleGet(guildId, selectedRole);
      if (!role) {
        return {
          error: 'Invalid role. Remember: first you copy, then you paste.'
        };
      } else {
        // Save the selection in ctx for later steps
        ctx.selectedRoleName = selectedRole;
        ctx.selectedRole = role;
        return {
          content: `What would you like to edit for ${selectedRole}?`,
          buttons: [
            {
              customId: 'editRoleName',
              label: 'Role Name',
              style: 'PRIMARY',
            },
            {
              customId: 'editRoleAmount',
              label: 'Role Amount',
              style: 'PRIMARY',
            }
          ]
        }
      }
    }
  }
}
