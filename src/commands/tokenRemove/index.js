const { removeRole } = require('./removeRole');
const { removeVerify } = require('./removeVerify');

module.exports = {
  starryCommandTokenRemove: {
    ephemeral: true,
    adminOnly: true,
    name: 'remove',
    description: 'Remove token rule',
    getConfig: async ({ guildId }, { db: { rolesGet } }) => {
      let roles = await rolesGet(guildId);
      if (roles.length === 0) {
        // Nothing to actually delete
        return {
          embeds: [
            {
              title: 'No token rules found',
              description: 'Nothing for starrybot to delete this time ☀️',
            }
          ],
          ephemeral: true,
        }
      } else {
        return {
          ephemeral: true,
          next: 'removeVerify',
          prompt: {
            type: 'select',
            title: 'Which token rule would you like to remove?',
            options: roles.map(role => ({
              label: role.give_role,
              description: `Type: ${role.token_type}, Min: ${role.has_minimum_of / (10 ** role.decimals)}, Count staked only: ${role.count_staked_only ?? false}`,
              value: role.give_role,
            }))
          }
        }
      }
    },
    steps: {
      removeRole,
      removeVerify,
    }
  }
}
