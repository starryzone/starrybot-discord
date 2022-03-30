const { rolesGet } = require("../../db");
const { createEmbed } = require("../../utils/messages");

async function starryCommandTokenList(req, res, ctx, next) {
  const { interaction } = req;
  let roles = await rolesGet(interaction.guildId);
  const title = `${roles.length} roles found`;
  const description = roles.length > 0 ?
    `${roles.map(role => {
        const roleName = role.give_role;
        const roleAmt = role.has_minimum_of;
        const roleDecimals = role.decimals;
        return `★ ${roleName} (min: ${(roleAmt / (10 ** roleDecimals)) })\n`;
      }).join('')}` :
    `This will be way more exciting when roles are added :)`;

  interaction.reply({
    embeds: [
      createEmbed({ title, description })
    ]
  })
  res.done();
}

module.exports = {
  starryCommandTokenList: {
    name: 'list',
    description: 'List all token rules for this guild',
    execute: starryCommandTokenList,
  }
}
