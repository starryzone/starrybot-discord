module.exports = {
  // TODO: feels like this should be promptRoleName
  promptTokenName: {
    getConfig: async (state, {
      astrolabe: { getTokenDetails },
      daodao: { isDaoDaoAddress, getCW20InputFromDaoDaoDao },
      stargaze: { isStargazeLaunchpadAddress, getCW721FromStargazeUrl },
    }) => {
      // Required for every flow in token-rule add
      const selectedRoleName = state.interactionTarget.fields.getTextInputValue('role-name');

      // This is set for CW20 and CW721 only
      let tokenAddress;
      if (state.tokenType !== 'native') {
        tokenAddress = state.interactionTarget.fields.getTextInputValue('token-address');
        if (tokenAddress) {
          try {
            if (isDaoDaoAddress(tokenAddress)) {
              const daoDetails = await getCW20InputFromDaoDaoDao(tokenAddress);
              tokenAddress = daoDetails.govToken
              state.stakingContract = daoDetails.stakingContract;
            } else if (isStargazeLaunchpadAddress(tokenAddress)) {
              tokenAddress = await getCW721FromStargazeUrl(tokenAddress);
            }
            const results = await getTokenDetails({ tokenAddress });
            // TO-DO: This is silly, but currently works because native token rules
            // don't go through this if statement.
            state.tokenAddress = results.tokenType === 'cw20' ? results.cw20Input : results.cw721;
            state.network = results.network;
            state.tokenType = results.tokenType;
            state.tokenSymbol = results.tokenSymbol;
            state.decimals = results.decimals;
          } catch (error) {
            // Notify the channel with whatever went wrong in this step
            return { error };
          }
        }
      }

      // This is set for native and cw20 only
      let amountOfTokensNeeded;
      if (state.tokenType !== 'cw721') {
        amountOfTokensNeeded = parseInt(state.interactionTarget.fields.getTextInputValue('token-amount'));

        // TODO: add fix so they can enter .1 instead of 0.1 and have it work
        if (
          !Number.isInteger(amountOfTokensNeeded) ||
          amountOfTokensNeeded <= 0
        ) {
          // Invalid reply
          return {
            error: 'Need a positive number of tokens.',
          };
        }

        // Multiply by the decimals for native and fungible tokens
        console.log('Multiplying by the number of decimals', state.decimals)
        state.minimumTokensNeeded = amountOfTokensNeeded * (10 ** state.decimals)
      } else {
        // We don't currently prompt for how many NFTs someone should have
        // to get a role
        state.minimumTokensNeeded = 1;
      }
      console.log('Minimum amount needed', state.minimumTokensNeeded)

      const { guild } = state

      const existingObjectRoles = await guild.roles.fetch();
      let roleAlreadyExists = existingObjectRoles.some(role => role.name === selectedRoleName);
      if (roleAlreadyExists) {
        // Invalid reply
        return {
          error: 'A token role already exists with this name. Please pick a different name, or rename that one first.'
        };
      }

      // We can make the new role, set it in state for creation and addition
      //   to database later
      state.selectedRoleName = selectedRoleName

      return {
        prompt: {
          type: 'button',
          title: 'Count only staked tokens?',
          options: [{
            next: 'handleStakedOnlyYes',
            label: 'Yes'
          }, {
            next: 'handleStakedOnlyNo',
            label: 'No, count them all'
          }],
          footer: 'If you select "No" it will count liquid, staked, and currently unbonding where applicable.',
        }
      }
    }
  }
}
