const { editRole } = require('./editRole');
const { editRoleStakedOnly } = require('./editRoleStakedOnly');
const { handleRoleEdit } = require('./handleRoleEdit');

module.exports = {
  starryCommandTokenEdit: {
    adminOnly: true,
    name: 'edit',
    description: "Edit a token rule's name or amount",
    getConfig: async ({ guildId }, { db: { rolesGet } }) => {
      let roles = await rolesGet(guildId);
      if (roles.length === 0) {
        return {
          message: 'No roles exist to edit!',
        }
      } else {
        return {
          ephemeral: true,
          next: 'editRole',
          prompt: {
            type: 'select',
            title: 'Which token rule would you like to edit?',
            options: roles.map(role => ({
              label: role.give_role,
              description: `Type: ${role.token_type}, Min: ${role.has_minimum_of / (10 ** role.decimals)}, Count staked only: ${role.count_staked_only ?? false}`,
              value: role.give_role,
            })),
          }
        }
      }
    },
    steps: {
      editRole,
      editRoleStakedOnly,
      handleRoleEdit,
    }
  }
}
