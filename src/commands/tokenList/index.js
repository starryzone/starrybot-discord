module.exports = {
  starryCommandTokenList: {
    name: 'list',
    description: 'List all token rules for this guild',
    config: async ({ guildId }, { db: { rolesGet } }) => {
      let roles = await rolesGet(guildId);
      const title = `${roles.length} roles found`;
      const description = roles.length > 0 ?
        `${roles.map(role => {
            const roleName = role.give_role;
            const roleAmt = role.has_minimum_of;
            const roleDecimals = role.decimals;
            return `★ ${roleName} (min: ${(roleAmt / (10 ** roleDecimals)) })\n`;
          }).join('')}` :
        `This will be way more exciting when roles are added :)`;
      return {
        done: { title, description }
      };
    }
  }
}
