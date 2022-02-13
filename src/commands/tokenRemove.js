const { createEmbed } = require("../utils/messages");
const { rolesGet } = require("../db");

async function starryCommandTokenRemove(req, res, ctx, next) {
  const { interaction } = req;

  let roles = await rolesGet(interaction.guildId);
  if (roles.length === 0) {
    // Nothing to actually delete
    await interaction.reply({
      embeds: [
        createEmbed({
          title: 'No token rules found',
          description: 'Nothing for starrybot to delete this time ☀️',
        }),
      ],
      ephemeral: true
    });

    res.done();

  } else {
    // Show them the options for deletion
    const description = `${roles.map(role => role.give_role).join('\n')}`;
    await interaction.reply({
      embeds: [
        createEmbed({
          color: '#FDC2A0',
          title: 'Current token rules',
          description,
          footer: 'Please type a token rule to remove'
        })
      ],
      ephemeral: true
    });

    next(() => 'removeVerify');
  }
}

module.exports = {
  starryCommandTokenRemove: {
    adminOnly: true,
    name: 'remove',
    description: '(Admin only) Remove token rule',
    execute: starryCommandTokenRemove,
  }
}
