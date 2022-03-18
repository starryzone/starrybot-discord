const { createEmbed } = require("../../utils/messages");

async function editRoleAmount(req, res, ctx, next) {
  const { interaction } = req;
  await interaction.reply({
    embeds: [
      createEmbed({
        color: '#FDC2A0',
        title: 'How many tokens?',
        description: `Please enter the new amount of tokens a user needs to get the role named ${ctx.selectedRoleName} (current: ${ctx.selectedRole.has_minimum_of / (10 ** ctx.selectedRole.decimals)}).`,
      })
    ]
  });
  next(() => 'handleRoleAmountEdit');
}

module.exports = {
  editRoleAmount,
}
