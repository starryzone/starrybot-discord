module.exports = {
  removeVerify: {
    ephemeral: true,
    getConfig: async (state, { db: { roleGet } }) => {
      const { guildId, interaction: { values }} = state;
      // Fetch + save the role that they selected from the dropdown
      const selectedRole = values?.[0];
      state.selectedRole = selectedRole;

      // Make sure we recognize the selected role
      const role = await roleGet(guildId, selectedRole);
      if (!role) {
        return {
          error: 'Invalid role. Remember: first you copy, then you paste.',
        };
      }

      return {
        next: 'removeRole',
        prompt: {
          type: 'button',
          title: `Are you sure you want to delete ${selectedRole}?`,
          options: [
            {
              label: 'Yes please!',
              value: 'yes',
            },
            {
              label: 'Cancel',
              style: 'Secondary',
              value: 'no',
            }
          ]
        },
      }
    }
  }
}
