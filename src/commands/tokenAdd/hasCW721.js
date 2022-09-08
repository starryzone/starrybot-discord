module.exports = {
  hasCW721: {
    next: 'promptTokenName',
    prompt: {
      type: 'modal',
      title: "Configure CW721 Token Rule",
      inputs: [
        {
          label: 'Token Address',
          placeholder: 'Please write the cw721 token address',
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
