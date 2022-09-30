const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

module.exports = {
  removeRole: {
    getConfig: async (
      { guild, guildId, interactionTarget, selectedRole },
      { db: { myConfig, rolesDelete } }
    ) => {
      // See which button they pressed based on the customId
      const shouldRemove = (interactionTarget.customId === 'yes');
      if (!shouldRemove) {
        // They hit "Cancel", so we can back out early.
        return {
          message: '🌟 No changes made 👍',
        }
      } else {
        // They hit "Yes", so first try to delete the role from discord
        const roleManager = guild.roles;
        const rest = new REST().setToken(myConfig.DISCORD_TOKEN);
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
}
