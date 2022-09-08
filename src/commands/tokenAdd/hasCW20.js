module.exports = {
  hasCW20: {
    next: 'promptTokenName',
    prompt: {
      type: 'modal',
      title: 'Configure CW20 Token Rule',
      inputs: [
        {
          label: 'Token Address',
          placeholder: 'Please enter the CW20 token address',
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
}
