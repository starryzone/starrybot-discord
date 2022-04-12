const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

module.exports = {
  removeConfirmation: {
    getConfig: async (
      { guild, guildId, userInput: selectedRole },
      { db: { myConfig, rolesDelete } }
    ) => {
      const roleManager = guild.roles;
      const rest = new REST().setToken(myConfig.DISCORD_TOKEN);

      // First try to delete the role from discord
      try {
        let roleObj = roleManager.cache.find(r => r.name === selectedRole)
        if (roleObj) await rest.delete(Routes.guildRole(guildId, roleObj.id))
      } catch (e) {
        return {
          error: `Error deleting ${role['give_role']}: ${e}`,
        };
      }

      // Delete the selected role from the database
      await rolesDelete(guildId, selectedRole)

      // Let them know we've succeeded!
      return {
        done: {
          description: `${selectedRole} has been successfully removed!`
        }
      }
    }
  }
}
