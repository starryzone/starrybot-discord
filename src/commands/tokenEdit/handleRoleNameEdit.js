const { rolesSet, rolesDelete } = require("../../db");

module.exports = {
  handleRoleNameEdit: {
    name: 'handleRoleNameEdit',
    config: async (req, ctx, next) => {
      const { userId, guild, guildId, userInput: content } = ctx;

      let newRoleName = content;
      const existingObjectRoles = await guild.roles.fetch();
      let roleAlreadyExists = existingObjectRoles.some(role => role.name === newRoleName);
      if (roleAlreadyExists) {
        // Invalid reply
        return {
          error: 'A token role already exists with this name. Please pick a different name, or rename that one first.'
        }
      }

      try {
        // Rename the current role in discord
        const existingRole = existingObjectRoles.find(discordRole => discordRole.name === ctx.selectedRoleName);
        await guild.roles.edit(existingRole, { name: newRoleName });
      } catch (e) {
        if (e.message.includes('Supplied role is not a RoleResolvable')) {
          return {
            error: `I was unable to find the role in the Discord channel.`,
          }
        } else {
          return {
            error: `I was unable to update the guild roles: ${e?.message || e}`
          }
        }
      }

      // Add a new database row with the new name + same rest of data
      await rolesSet(guildId, newRoleName, ctx.selectedRole.token_type, ctx.selectedRole.token_address, ctx.selectedRole.network, true, userId, ctx.selectedRole.has_minimum_of, ctx.selectedRole.decimals);

      // Delete the original one
      await rolesDelete(guildId, ctx.selectedRoleName);
    
      return {
        doneMessage: `${ctx.selectedRoleName} has been renamed to ${newRoleName} (min: ${ctx.selectedRole.has_minimum_of / (10 ** ctx.selectedRole.decimals)}).\n\nEnjoy, traveller!`
      }
    }
  }
}
