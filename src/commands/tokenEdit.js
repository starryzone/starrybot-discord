const { rolesGet } = require("../db");
const { createEmbed } = require("../utils/messages");

async function starryCommandTokenEdit(req, res, ctx, next) {
 const { interaction } = req;
 let roles = await rolesGet(interaction.guildId);

 if (roles.length === 0) {
   interaction.reply({
    description: 'No roles exist to edit!'
   });
   res.done();
 }
 else {
    const title = `Current token rules`;
    const description = `${roles.map(role => {
      const roleName = role.give_role;
      const roleAmt = role.has_minimum_of;
      const roleDecimals = role.decimals;
      return `★ ${roleName} (min: ${(roleAmt / (10 ** roleDecimals)) })\n`;
    }).join('')}`;
    const footer = 'Please type a token rule to edit'

    interaction.reply({
      embeds: [
        createEmbed({ title, description, footer })
      ],
      ephemeral: true
    });

    next('editCheck')
 }
}

module.exports = {
  starryCommandTokenEdit: {
    adminOnly: true,
    name: 'edit',
    description: "(Admin only) Edit a token rule's name or amount",
    execute: starryCommandTokenEdit,
  }
}
