module.exports = {
  editRoleName: {
    name: 'editRoleName',
    config: async ({ selectedRoleName }) => {
      return {
        next: 'handleRoleNameEdit',
        prompt: {
          type: 'input',
          title: "What is the new name?",
          description: `Please enter the new name for the role currently named ${selectedRoleName}.`,
        }
      }
    }
  }
}
