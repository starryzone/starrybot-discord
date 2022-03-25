module.exports = {
	removeVerify: {
		name: 'removeVerify',
		config: async ({ guildId, userInput: selectedRole }, { db: { roleGet } }) => {
			// Make sure we recognize the selected role
			const role = await roleGet(guildId, selectedRole);
			if (!role) {
				return {
					error: 'Invalid role. Remember: first you copy, then you paste.',
				};
			}
		
			return {
				message: `Are you sure you want to delete ${selectedRole}?`,
				prompt: {
					type: 'button',
					options: [
						{
							next: 'removeConfirmation',
							label: 'Yes please!',
							style: 'PRIMARY',
						},
						{
							next: 'removeRejection',
							label: 'Cancel',
							style: 'SECONDARY',
						}
					]
				},
			}
		}
	}
}
