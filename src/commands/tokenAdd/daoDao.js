module.exports = {
  daoDao: {
    next: 'promptTokenName',
    prompt: {
      type: 'modal',
      title: 'Configure DAODAO Token Rule',
      inputs: [
        {
          label: 'DAODAO URL',
          placeholder: "Paste your DAODAO URL and we'll take care of the rest!",
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
