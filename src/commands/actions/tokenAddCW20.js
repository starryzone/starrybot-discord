const tokenAddCW20 = async state => {
  // See which button they pressed and update the state appropriatley
  const selectedOption = state.interactionTarget.customId;
  state.selectedOption = selectedOption;

  return {
    next: 'createTokenRule',
    prompt: {
      type: 'modal',
      title: `Configure ${selectedOption} Token Rule`,
      inputs: [
        {
          label: selectedOption === 'CW20' ? 'Token Address' : 'DAODAO URL',
          placeholder: selectedOption === 'CW20' ?
            'Please enter the CW20 token address' :
            "Paste your DAODAO URL and we'll take care of the rest!",
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
          label: 'Token Amount',
          placeholder: 'Please enter the number of tokens a user must have to get a special role',
          id: 'token-amount',
          required: true,
        }
      ]
    }
  }
};

module.exports = { tokenAddCW20 };
