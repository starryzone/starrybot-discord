module.exports = {
  editRoleName: {
    getConfig: async ({ selectedRoleName }) => {
      return {
        next: 'handleRoleNameEdit',
        prompt: {
          type: 'modal',
          title: "What is the new name?",
          description: `Please enter the new name for the role currently named ${selectedRoleName}.`,
        }
      }
    }
  }
}
