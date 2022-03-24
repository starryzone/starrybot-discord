const { createEmbed } = require("../../utils/messages");

async function editRoleName(req, res, ctx, next) {
  const { interaction } = req;
  await interaction.reply({
    embeds: [
      createEmbed({
        color: '#FDC2A0',
        title: "What is the new name?",
        description: `Please enter the new name for the role currently named ${ctx.selectedRoleName}.`,
      })
    ]
  });
  next('handleRoleNameEdit')
}

module.exports = {
  editRoleName,
}
