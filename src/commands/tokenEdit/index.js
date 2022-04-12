const { editCheck } = require('./editCheck');
const { editRoleAmount } = require('./editRoleAmount');
const { editRoleName } = require('./editRoleName');
const { handleRoleAmountEdit } = require('./handleRoleAmountEdit');
const { handleRoleNameEdit } = require('./handleRoleNameEdit');

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
        const title = `Current token rules`;
        const description = `${roles.map(role => {
          const roleName = role.give_role;
          const roleAmt = role.has_minimum_of;
          const roleDecimals = role.decimals;
          return `★ ${roleName} (min: ${(roleAmt / (10 ** roleDecimals)) })\n`;
        }).join('')}`;
        const footer = 'Please type a token rule to edit';

        return {
          ephemeral: true,
          next: 'editCheck',
          prompt: {
            type: 'input',
            title,
            description,
            footer,
          }
        }
      }
    },
    steps: {
      editCheck,
      editRoleAmount,
      editRoleName,
      handleRoleAmountEdit,
      handleRoleNameEdit,
    }
  }
}
