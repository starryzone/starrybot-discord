module.exports = {
  handleRoleAmountEdit: {
    name: 'handleRoleAmountEdit',
    config: async (
      {
        userId,
        guildId,
        userInput: amountOfTokensNeeded,
        selectedRoleName,
        selectedRole: { decimals, network, token_address, token_type }
      },
      {
        db: { rolesSet }
      }
    ) => {
      if (
        !Number.isInteger(parseInt(amountOfTokensNeeded)) ||
        amountOfTokensNeeded <= 0
      ) {
        // Invalid reply
        return {
          error: 'Need a positive number of tokens.'
        }
      }

      // Multiply by the decimals for native and fungible tokens
      if (['native', 'cw20'].includes(token_type)) {
        amountOfTokensNeeded = amountOfTokensNeeded * (10 ** decimals)
      }

      // Update the database row with the new amount + same rest of data
      await rolesSet(guildId, selectedRoleName, token_type, token_address, network, true, userId, amountOfTokensNeeded, decimals);

      return {
        done: {
          message: `${selectedRoleName} has been updated to require ${amountOfTokensNeeded / (10 ** decimals)} tokens moving forward. Please note that this change will not apply to current hodlers of the role. \n\nEnjoy, traveller!`
        }
      }
    }
  }
}
