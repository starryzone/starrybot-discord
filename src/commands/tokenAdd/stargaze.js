module.exports = {
  stargaze: {
    next: 'createTokenRule',
    prompt: {
      type: 'modal',
      title: "Configure Stargaze Token Rule",
      inputs: [
        {
          label: 'Stargaze URL',
          placeholder: 'Paste the Stargaze URL for the NFT collection and we can do the rest!',
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
}
