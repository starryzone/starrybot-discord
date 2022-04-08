const { roleGet } = require("../../db");
const { createButton, createMessageActionRow } = require("../../utils/messages");

async function editCheck(req, res, ctx, next) {
  const { interaction } = req;
  const { guildId } = interaction;
  const selectedRole = interaction.content;
  // Save the selection in ctx for later steps
  ctx.selectedRoleName = selectedRole;

  // Make sure we recognize the selected role
  const role = await roleGet(guildId, selectedRole);
  if (!role) {
    return await res.error('Invalid role. Remember: first you copy, then you paste.')
  }
  ctx.selectedRole = role;

  const row = createMessageActionRow({
    components: [
      createButton({
        customId: 'editRoleName',
        label: 'Role Name',
        style: 'PRIMARY',
      }),
      createButton({
        customId: 'editRoleAmount',
        label: 'Role Amount',
        style: 'PRIMARY',
      }),
    ]
  });

  await interaction.reply({
    content: `What would you like to edit for ${selectedRole}?`,
    components: [row]
  });

  next(interaction => interaction.customId);
}

module.exports = {
  editCheck
}
