module.exports = {
  handleStakedOnlyNo: {
    getConfig: async (
      { interaction,
        guild,
        selectedRoleName,
        guildId,
        tokenType,
        tokenAddress,
        network,
        userId,
        minimumTokensNeeded,
        decimals,
        stakingContract
      },
      {
        db: { rolesSet }
      }
    ) => {
      console.log('User wants to count all tokens (not just staked)')

      // Create role in Discord
      await guild.roles.create({name: selectedRoleName, position: 0});

      // Create database row
      await rolesSet(
        guildId,
        selectedRoleName,
        tokenType,
        tokenAddress,
        network,
        true,
        userId,
        minimumTokensNeeded,
        decimals,
        stakingContract,
        false // count_staked_only
      );

      return {
        done: {
          description: `You may now use the role ${selectedRoleName} for token-gated channels.\n\nEnjoy, traveller!`
        }
      }
    }
  }
}
