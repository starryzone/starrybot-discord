const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { myConfig, rolesDelete } = require("../../db");

module.exports = {
  removeConfirmation: {
    name: 'removeConfirmation',
    config: async (req, res, ctx, next) => {
      const { interaction } = req;
      const { guild, guildId } = interaction;
      const roleManager = guild.roles;
      const rest = new REST().setToken(myConfig.DISCORD_TOKEN);
      const { selectedRole } = ctx;

      // First try to delete the role from discord
      try {
        let roleObj = roleManager.cache.find(r => r.name === selectedRole)
        if (roleObj) await rest.delete(Routes.guildRole(guildId, roleObj.id))
      } catch (e) {
        return await res.error(`Error deleting ${role['give_role']}: ${e}`);
      }

      // Delete the selected role from the database
      await rolesDelete(guildId, selectedRole)

      // Let them know we've succeeded!
      return {
        doneMessage: `${selectedRole} has been successfully removed!`
      }
    }
  }
}
