const { removeConfirmation } = require('./removeConfirmation');
const { removeRejection } = require('./removeRejection');
const { removeVerify } = require('./removeVerify');

module.exports = {
  starryCommandTokenRemove: {
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
        // Show them the options for deletion
        const description = `${roles.map(role => role.give_role).join('\n')}`;
        return {
          ephemeral: true,
          next: 'removeVerify',
          prompt: {
            type: 'input',
            title: 'Current token rules',
            description,
            footer: 'Please type a token rule to remove'
          }
        }
      }
    },
    steps: {
      removeConfirmation,
      removeRejection,
      removeVerify,
    }
  }
}
