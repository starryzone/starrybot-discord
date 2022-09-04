module.exports = {
  handleRoleStakedOnlyEditNo: {
    getConfig: async (
      {
        userId,
        guildId,
        selectedRoleName,
        selectedRole: { token_address, token_type, has_minimum_of, network, decimals, staking_contract }
      },
      {
        db: { rolesSet }
      }
    ) => {
      // Update the database row with the new amount + same rest of data
      await rolesSet(guildId, selectedRoleName, token_type, token_address, network, true, userId, has_minimum_of, decimals, staking_contract, false);

      return {
        done: {
          description: `${selectedRoleName} has been updated to only sum all liquid, staked, and unbonding tokens where applicable. \n\nEnjoy, traveller!`
        }
      }
    }
  }
}
