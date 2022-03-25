module.exports = {
  editRoleAmount: {
    name: 'editRoleAmount',
    config: async ({
      selectedRoleName,
      selectedRole: { decimals, has_minimum_of }
    }) => {
      return {
        embeds: [
          {
            color: '#FDC2A0',
            title: 'How many tokens?',
            description: `Please enter the new amount of tokens a user needs to get the role named ${selectedRoleName} (current: ${has_minimum_of / (10 ** decimals)}).`,
          }
        ],
        next: 'handleRoleAmountEdit',
      }
    }
  }
}
