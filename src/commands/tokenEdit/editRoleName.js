module.exports = {
  editRoleName: {
    name: 'editRoleName',
    config: async ({ selectedRoleName }) => {
      return {
        messageType: 'prompt',
        embeds: [
          {
            title: "What is the new name?",
            description: `Please enter the new name for the role currently named ${selectedRoleName}.`,
          }
        ],
        next: 'handleRoleNameEdit',
      }
    }
  }
}
