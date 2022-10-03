const { rolesGet } = require("../../db");
const { getRoleDescription } = require('../../utils/text');

const tokenList = async ({ guildId }) => {
  let roles = await rolesGet(guildId);
  const title = `${roles.length} roles found`;
  const description = roles.length > 0 ?
    `${roles.map(role => `★ ${role.give_role} - ${getRoleDescription(role)}\n${role.token_address}\n\n`).join('')}` :
    `This will be way more exciting when roles are added :)`;
  return {
    ephemeral: true,
    done: { title, description }
  };
}

module.exports = { tokenList };
