module.exports = {
  editRoleAmount: {
    name: 'editRoleAmount',
    config: async ({
      selectedRoleName,
      selectedRole: { decimals, has_minimum_of }
    }) => {
      return {
        messageType: 'prompt',
        embeds: [
          {
            title: 'How many tokens?',
            description: `Please enter the new amount of tokens a user needs to get the role named ${selectedRoleName} (current: ${has_minimum_of / (10 ** decimals)}).`,
          }
        ],
        next: 'handleRoleAmountEdit',
      }
    }
  }
}
