const { roleGet } = require("../../db");
const { createButton, createMessageActionRow } = require("../../utils/messages");

///
/// Farewell
///

async function removeVerify(req, res, ctx, next) {
  const { interaction } = req;
  const { guildId } = interaction;
  const selectedRole = interaction.content;
  // Save the selection in ctx for removeConfirmation
  ctx.selectedRole = selectedRole;

  // Make sure we recognize the selected role
  const role = await roleGet(guildId, selectedRole);
  if (!role) {
    return await res.error('Invalid role. Remember: first you copy, then you paste.')
  }

  const row = createMessageActionRow({
    components: [
      createButton({
        customId: 'removeConfirmation',
        label: 'Yes please!',
        style: 'PRIMARY',
      }),
      createButton({
        customId: 'removeRejection',
        label: 'Cancel',
        style: 'SECONDARY',
      }),
    ]
  });

  await interaction.reply({
    content: `Are you sure you want to delete ${selectedRole}?`,
    components: [row]
  });

  return next(interaction => interaction.customId);
}

module.exports = {
  removeVerify
}
