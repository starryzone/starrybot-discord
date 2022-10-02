const { rolesSet } = require("../../db");
const { getCosmClientForDao, getDAOAddressFromDAODAOUrl, isDaoDaoAddress } = require("../../astrolabe/daodao");

const tokenAddFinish = async (
  {
    daoVoteType, // Hackathon only
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

  let countStakedOnly;
  // TO-DO: For the hackathon, we're going to shove stuff into starry_roles that doesn't
  // make any sense. If this is to be productionized later, we're gonna need a few more
  // tables and maybe some mild db refactoring in prod.
  if (daoVoteType) {
    // Get the data from the modal - should be what the stakedOnly step
    // was doing, but we skip it for the dao vote flow for now
    selectedRoleName = interactionTarget.fields.getTextInputValue('role-name');
    tokenAddress = interactionTarget.fields.getTextInputValue('token-address');
    // TO-DO: We don't validate this for now, but ultimately we won't want them to configure
    // negative minimums or percentages over 100%.
    minimumTokensNeeded = parseInt(interactionTarget.fields.getTextInputValue('token-amount'));
    decimals = interactionTarget.fields.getTextInputValue('decimals') || 0;
    // This currently can be either a token or a URL, which is probably not necessary
    network = tokenAddress.includes('testnet') ? 'testnet' : 'mainnet';

    // TO-DO: We don't currently validate this is a valid dao address if we're given
    // the CW20 directly
    const daoAddress = isDaoDaoAddress(tokenAddress) ?
      getDAOAddressFromDAODAOUrl(tokenAddress) :
      tokenAddress;
    tokenAddress = daoAddress; // Don't accidentally save a dao dao URL
    const cosmClient = await getCosmClientForDao(daoAddress, network);
    // Staking contract is currently being used to save the proposal module address
    // instead, since that saves us a step when we're trying to query for
    // proposal info
    let proposalModules;
    try {
      proposalModules = await cosmClient.queryContractSmart(daoAddress, {
        proposal_modules: { },
      });
      if (proposalModules?.length > 0) {
        stakingContract = proposalModules[0];
      }
    } catch {
      // Legacy DAOS don't have the proposal_modules endpoint, but we're able to
      // call list_proposals and list_votes on them directly, so we can just
      // double-save them in the staking contract for downstream convenience
      stakingContract = daoAddress;
    }

    // Decimals is currently being used to track how many proposals we compare agains
    if (decimals && parseInt(decimals.replace('%',''))) {
      decimals = parseInt(decimals.replace('%',''));
      countStakedOnly = decimals > 0;
    }

  } else {
    // See which button they pressed based on the custom ID
    countStakedOnly = (interactionTarget.customId === 'yes');
  }

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
