module.exports = {
  removeVerify: {
    ephemeral: true,
    getConfig: async (state, { db: { roleGet } }) => {
      const { guildId, interaction: { values }} = state;
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
        prompt: {
          type: 'button',
          title: `Are you sure you want to delete ${selectedRole}?`,
          options: [
            {
              next: 'removeConfirmation',
              label: 'Yes please!',
            },
            {
              next: 'removeRejection',
              label: 'Cancel',
              style: 'Secondary',
            }
          ]
        },
      }
    }
  }
}
