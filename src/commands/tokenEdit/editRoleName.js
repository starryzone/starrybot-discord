module.exports = {
  editRoleName: {
    name: 'editRoleName',
    config: async ({ selectedRoleName }) => {
      return {
        embeds: [
          {
            title: "What is the new name?",
            description: `Please enter the new name for the role currently named ${selectedRoleName}.`,
          }
        ],
        next: 'handleRoleNameEdit',
        prompt: {
          type: 'input',
        }
      }
    }
  }
}
