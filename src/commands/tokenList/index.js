module.exports = {
  starryCommandTokenList: {
    name: 'list',
    description: 'List all token rules for this guild',
    getConfig: async ({ guildId }, { db: { rolesGet } }) => {
      let roles = await rolesGet(guildId);
      const title = `${roles.length} roles found`;
      const description = roles.length > 0 ?
        `${roles.map(role => {
            const roleName = role.give_role;
            const roleAmt = role.has_minimum_of;
            const roleDecimals = role.decimals;
            return `★ ${roleName}\n - min: ${(roleAmt / (10 ** roleDecimals)) }\n- count staked only: ${role.count_staked_only ?? false}\n`;
          }).join('')}` :
        `This will be way more exciting when roles are added :)`;
      return {
        done: { title, description }
      };
    }
  }
}
