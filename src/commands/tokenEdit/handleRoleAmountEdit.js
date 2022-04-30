module.exports = {
  handleRoleAmountEdit: {
    getConfig: async (
      {
        userId,
        guildId,
        userInput,
        selectedRoleName,
        selectedRole: { decimals, network, token_address, token_type, staking_contract, count_staked_only }
      },
      {
        db: { rolesSet }
      }
    ) => {
      let amountOfTokensNeeded = parseInt(userInput)
      if (
        !Number.isInteger(amountOfTokensNeeded) ||
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
      await rolesSet(guildId, selectedRoleName, token_type, token_address, network, true, userId, amountOfTokensNeeded, decimals, staking_contract, count_staked_only);

      return {
        done: {
          description: `${selectedRoleName} has been updated to require ${amountOfTokensNeeded / (10 ** decimals)} tokens moving forward. Please note that this change will not apply to current hodlers of the role. \n\nEnjoy, traveller!`
        }
      }
    }
  }
}
