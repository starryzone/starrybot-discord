const tokenAddDaoVotes = async state => {
  // See which button they pressed and update the state appropriately
  const selectedOption = state.interactionTarget.customId;
  state.tokenType = selectedOption;
  state.daoVoteType = true; // Hackathon convenience only

  // The text we want to display based on which button they pressed
  const optionsConfig = {
    DAOVoteMinimum: {
      name: 'Vote Minimum',
      tokenAmountLabel: 'Vote Minimum',
      tokenAmountPlaceholder: 'Please enter how many times a user must have voted to receive this role'
    },
    DAOVotePercentage: {
      name: 'Vote Percentage',
      tokenAmountLabel: 'Vote Percentage',
      tokenAmountPlaceholder: 'Please enter the minimum percentage of proposals a user must have voted in to receive this role'
    },
    DAOMostParticipation: {
      name: 'Most Participation',
      tokenAmountLabel: 'Participation Percentage',
      tokenAmountPlaceholder: 'Please enter what percentage of top proposal voters should receive the role'
    }
  }

  return {
    next: 'handleRoleCreate',
    prompt: {
      type: 'modal',
      title: `Configure ${optionsConfig[selectedOption].name} Token Rule`,
      inputs: [
        {
          label: 'DAO Identifier',
          placeholder: 'Please enter either the DAO Address or the DAODAO Url of the DAO we will be checking votes for',
          id: 'token-address',
          required: true,
        },
        {
          label: 'Role Name',
          placeholder: 'Please enter the name of the role that should created',
          id: 'role-name',
          required: true,
        },
        {
          label: optionsConfig[selectedOption].tokenAmountLabel,
          placeholder: optionsConfig[selectedOption].tokenAmountPlaceholder,
          id: 'token-amount',
          required: true,
        },
        {
          label: '(Optional) Number of Proposals to Check',
          placeholder: 'E.g. Set this to 10 to grant a role based on their vote participation for the last 10 proposals',
          id: 'decimals', // Hackathon only
          required: false
        }
      ]
    }
  }
};

module.exports = { tokenAddDaoVotes };
