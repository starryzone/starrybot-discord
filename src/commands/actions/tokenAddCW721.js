const tokenAddCW721 = async (state) => {
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
          label: selectedOption === 'CW721' ? 'Token Address' : 'Stargaze URL',
          placeholder: selectedOption === 'CW721' ?
            'Please enter the CW721 token address' :
            "Paste the Stargaze URL for the NFT collection and we can do the rest!",
          id: 'token-address',
          required: true,
        },
        {
          label: 'Role Name',
          placeholder: 'Please enter the name of the role that should created',
          id: 'role-name',
          required: true,
        },
      ]
    }
  }
};

module.exports = { tokenAddCW721 };
