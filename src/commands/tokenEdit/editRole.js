module.exports = {
  editRole: {
    getConfig: async (state, { db: { roleGet }}) => {
      const { guildId, interaction: { values }} = state;
      const selectedRoleName = values?.[0];
      const role = await roleGet(guildId, selectedRoleName);

      // Save the selection in state for later steps
      state.selectedRoleName = selectedRoleName;
      state.selectedRole = role;
      return {
        next: 'editRoleStakedOnly',
        prompt: {
          type: 'modal',
          title: 'Edit token rule',
          inputs: [
            {
              label: 'New Role Name',
              placeholder: 'Current name: ' + selectedRoleName,
              id: 'role-name',
            },
            ...(role.token_type !== 'cw721' ? [{
              label: 'New Token Amount',
              placeholder: 'Current amount needed: ' + (role.has_minimum_of / (10 ** role.decimals)),
              id: 'token-amount',
            }] : []),
          ]
        }
      }
    }
  }
}
