module.exports = {
  editRoleAmount: {
    getConfig: async ({
      selectedRoleName,
      selectedRole: { decimals, has_minimum_of }
    }) => {
      return {
        next: 'handleRoleAmountEdit',
        prompt: {
          type: 'input',
          title: 'How many tokens?',
          description: `Please enter the new amount of tokens a user needs to get the role named ${selectedRoleName} (current: ${has_minimum_of / (10 ** decimals)}).`,
        }
      }
    }
  }
}
