module.exports = {
  editRoleName: {
    name: 'editRoleName',
    config: async (ctx) => {
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
    }
  }
}
