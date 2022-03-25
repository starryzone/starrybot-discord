
const { rolesGet } = require("../db");

module.exports = {
  starryCommandTokenRemove: {
    adminOnly: true,
    name: 'remove',
    description: '(Admin only) Remove token rule',
    config: async (req, res, ctx, next) => {
      const { interaction } = req;
      
      let roles = await rolesGet(interaction.guildId);
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
          done: true,
        }
      } else {
        // Show them the options for deletion
        const description = `${roles.map(role => role.give_role).join('\n')}`;
        return {
          embeds: [
            {
              color: '#FDC2A0',
              title: 'Current token rules',
              description,
              footer: 'Please type a token rule to remove'
            }
          ],
          ephemeral: true,
          next: 'removeVerify',
        }
      }
    }
  }
}
