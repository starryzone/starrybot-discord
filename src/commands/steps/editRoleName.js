const { buildBasicMessageCommand } = require('../../utils/commands');

module.exports = {
  editRoleName: {
    name: 'editRoleName',
    execute: buildBasicMessageCommand(async (req, res, ctx, next) => {
      return {
        embeds: [
          {
            color: '#FDC2A0',
            title: "What is the new name?",
            description: `Please enter the new name for the role currently named ${ctx.selectedRoleName}.`,
          }
        ],
        next: 'handleRoleNameEdit',
      }
    })
  }
}
