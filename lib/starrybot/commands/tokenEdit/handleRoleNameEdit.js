module.exports = {
  handleRoleNameEdit: {
    getConfig: async (
      {
        userId,
        guild,
        guildId,
        userInput: newRoleName,
        selectedRoleName,
        selectedRole: { decimals, has_minimum_of, network, token_address, token_type, staking_contract, count_staked_only }
      },
      {
        db: { rolesSet, rolesDelete }
      }
    ) => {
      const existingObjectRoles = await guild.roles.fetch();
      let roleAlreadyExists = existingObjectRoles.some(role => role.name === newRoleName);
      if (roleAlreadyExists) {
        // Invalid reply
        return {
          error: 'A token role already exists with this name. Please pick a different name, or rename that one first.'
        }
      }

      try {
        // Rename the current role in discord
        const existingRole = existingObjectRoles.find(discordRole => discordRole.name === selectedRoleName);
        await guild.roles.edit(existingRole, { name: newRoleName });
      } catch (e) {
        if (e.message.includes('Supplied role is not a RoleResolvable')) {
          return {
            error: `I was unable to find the role in the Discord channel.`,
          }
        } else {
          return {
            error: `I was unable to update the guild roles: ${e?.message || e}`
          }
        }
      }

      // Add a new database row with the new name + same rest of data
      await rolesSet(guildId, newRoleName, token_type, token_address, network, true, userId, has_minimum_of, decimals, staking_contract, count_staked_only);

      // Delete the original one
      await rolesDelete(guildId, selectedRoleName);

      return {
        done: {
          description: `${selectedRoleName} has been renamed to ${newRoleName} (min: ${has_minimum_of / (10 ** decimals)}).\n\nEnjoy, traveller!`
        },
      }
    }
  }
}
