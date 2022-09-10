module.exports = {
  handleRoleEdit: {
    getConfig: async (
      {
        userId,
        guild,
        guildId,
        interactionTarget,
        selectedRoleName,
        newRoleName,
        amountOfTokensNeeded,
        selectedRole: { token_address, token_type, has_minimum_of, network, decimals, staking_contract, count_staked_only }
      },
      {
        db: { rolesSet, rolesDelete }
      }
    ) => {
      const updatedStakedOnly = (interactionTarget.customId === 'yes');

      // If there was ultimately no change, we don't actually need to do anything.
      if (
        selectedRoleName === newRoleName &&
        has_minimum_of === amountOfTokensNeeded &&
        count_staked_only === updatedStakedOnly
      ) {
        return {
          done: {
            description: `No changed needed for ${selectedRoleName}. Have a good day!`,
          }
        }
      }

      // CW721 tokens currently cannot have token amounts changed
      const updatedAmountOfTokensNeeded = token_type === 'cw721' ?
        has_minimum_of :
        amountOfTokensNeeded * (10 ** decimals);
      
      // If the name has changed, we'll need to rename the role in discord, and then
      // replace the row in the DB altogether 
      if (selectedRoleName !== newRoleName) {
        try {
          // Rename the current role in discord
          const existingObjectRoles = await guild.roles.fetch();
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
        await rolesSet(guildId, newRoleName, token_type, token_address, network, true, userId, updatedAmountOfTokensNeeded, decimals, staking_contract, updatedStakedOnly);

        // Delete the original one
        await rolesDelete(guildId, selectedRoleName);
      } else {
        // if the name hasn't changed, we can just update the row with the new amount +
        // staked only value
        await rolesSet(guildId, selectedRoleName, token_type, token_address, network, true, userId, updatedAmountOfTokensNeeded, decimals, staking_contract, updatedStakedOnly);
      }

      // Human-friendly done message
      let changes = [];
      if (selectedRoleName !== newRoleName) {
        changes.push(`* Renamed from ${selectedRoleName} to ${newRoleName}`);
      }
      if (token_type !== 'cw721' && amountOfTokensNeeded !== has_minimum_of) {
        changes.push(`* Token minimum changed from ${has_minimum_of / (10 ** decimals)} to ${amountOfTokensNeeded}`);
      }
      if (count_staked_only !== updatedStakedOnly) {
        changes.push(count_staked_only ?
          `* Now counts liquid, staked, and currently unbonding where applicable.` :
          `* Now counts staked tokens only.`);
      }

      return {
        done: {
          description:
            `Updated ${selectedRoleName} as follows:\n\n` +
            changes.join('\n') +
            `\n\nEnjoy, traveller!`
        }
      }
    }
  }
}
