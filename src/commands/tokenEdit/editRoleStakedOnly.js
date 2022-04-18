module.exports = {
  editRoleStakedOnly: {
    getConfig: async () => {
      return {
        prompt: {
          type: 'button',
          title: 'Count only staked tokens?',
          options: [{
            next: 'handleRoleStakedOnlyEditYes',
            label: 'Yes'
          }, {
            next: 'handleRoleStakedOnlyEditNo',
            label: 'No, count them all'
          }],
          footer: 'If you select "No" it will count liquid, staked, and currently unbonding where applicable.',
        }
      }
    }
  }
}
