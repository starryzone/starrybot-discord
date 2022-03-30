module.exports = {
  promptTokenName: {
    getConfig: async (
      {
        userId,
        guild,
        guildId,
        userInput: content,
        tokenType,
        tokenAddress,
        network,
        minimumTokensNeeded,
        decimals,
        stakingContract
      },
      {
        db: { rolesSet }
      }
    ) => {

      let roleToCreate = content;
      const existingObjectRoles = await guild.roles.fetch();
      let roleAlreadyExists = existingObjectRoles.some(role => role.name === roleToCreate);
      if (roleAlreadyExists) {
        // Invalid reply
        return {
          error: 'A token role already exists with this name. Please pick a different name, or rename that one first.'
        };
      } else {
        await guild.roles.create({name: roleToCreate, position: 0});
      }

      // Create database row
      await rolesSet(
        guildId,
        roleToCreate,
        tokenType,
        tokenAddress,
        network,
        true,
        userId,
        minimumTokensNeeded,
        decimals,
        stakingContract
      );

      return {
        done: {
          message: `You may now use the role ${roleToCreate} for token-gated channels.\n\nEnjoy, traveller!`
        }
      }
    }
  }
}
