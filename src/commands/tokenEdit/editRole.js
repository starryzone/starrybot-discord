module.exports = {
  editRole: {
    deferReply: false, // Required for type modal
    getConfig: async (state, { db: { roleGet }}) => {
      const { guildId, interaction: { values }} = state;
      // Fetch the role they selected from the dropdown
      const selectedRoleName = values?.[0];
      // Get the entire role object for convenience - the next two
      // steps both need it
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
            {
              label: 'New Token Amount',
              placeholder: 'Current amount needed: ' + (role.has_minimum_of / (10 ** role.decimals)),
              id: 'token-amount',
            }
          ]
        }
      }
    }
  }
}
