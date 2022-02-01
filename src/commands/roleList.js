const { rolesGet } = require("../db");
const { createEmbed } = require("../utils/messages");

async function starryCommandRoleList(interaction) {
  let roles = await rolesGet(interaction.guildId);
  interaction.reply({
    embeds: [
      createEmbed({
        title: `StarryBot found ${roles.length} roles for this guild`,
        description: `${roles.map(role => '-' + role.give_role + '\n').join('')}`,
      })
    ]
  })
}

module.exports = {
  starryCommandRoleList
}
