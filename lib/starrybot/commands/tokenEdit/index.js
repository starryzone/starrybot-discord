const { editCheck } = require('./editCheck');
const { editRoleAmount } = require('./editRoleAmount');
const { editRoleName } = require('./editRoleName');
const { editRoleStakedOnly } = require('./editRoleStakedOnly');
const { handleRoleAmountEdit } = require('./handleRoleAmountEdit');
const { handleRoleNameEdit } = require('./handleRoleNameEdit');
const { handleRoleStakedOnlyEditYes } = require('./handleRoleStakedOnlyEditYes');
const { handleRoleStakedOnlyEditNo } = require('./handleRoleStakedOnlyEditNo');

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
          return `★ ${roleName}\n- min: ${(roleAmt / (10 ** roleDecimals)) }\n- count staked only: ${role.count_staked_only ?? false}\n`;
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
      editRoleStakedOnly,
      handleRoleAmountEdit,
      handleRoleNameEdit,
      handleRoleStakedOnlyEditYes,
      handleRoleStakedOnlyEditNo,
    }
  }
}
