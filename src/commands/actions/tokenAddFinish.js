const { rolesSet } = require("../../db");

const tokenAddFinish = async (
  {
    decimals,
    guild,
    guildId,
    interactionTarget,
    minimumTokensNeeded,
    network,
    selectedRoleName,
    stakingContract,
    tokenType,
    tokenAddress,
    userId,
  },
) => {
  // See which button they pressed based on the custom ID
  const countStakedOnly = (interactionTarget.customId === 'yes');


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
    countStakedOnly // count_staked_only
  );

  return {
    done: {
      description: `You may now use the role ${selectedRoleName} for token-gated channels.\n\nEnjoy, traveller!`
    }
  }
};

module.exports = { tokenAddFinish };
