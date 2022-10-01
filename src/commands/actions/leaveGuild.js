const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const leaveGuild = async (
  { guild, guildId, interaction },
  { db: { myConfig, rolesGetForCleanUp, rolesDeleteGuildAll } }
) => {
  const roleManager = guild.roles;
  const rest = new REST().setToken(myConfig.DISCORD_TOKEN);

  // find all roles to clean up
  const rolesToCleanUp = await rolesGetForCleanUp(guildId)
  for (let role of rolesToCleanUp) {
    try {
      let roleObj = roleManager.cache.find(r => r.name === role['give_role'])
      if (roleObj) await rest.delete(Routes.guildRole(guildId, roleObj.id))
    } catch (e) {
      console.log(`Error deleting account ${role['give_role']}`, e)
    }
  }

  // delete all the roles from the database
  await rolesDeleteGuildAll(guildId)

  // confirm
  // TO-DO: Same as the logic in util/commands
  const goodByeMsg = {content: 'Bye!', ephemeral: true};
  if (interaction.deferred) {
    await interaction.editReply(goodByeMsg)
  } else {
    try {
      await interaction.reply(goodByeMsg)
    } catch {
      await interaction.channel.send(goodByeMsg)
    }
  }
  

  // leave
  await interaction.guild.leave();

  // TO-DO: do we even need this?
  return null;
}

module.exports = { leaveGuild };
