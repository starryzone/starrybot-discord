const { buildBasicMessageCommand } = require('../utils/commands');

module.exports = {
	starryCommandFarewell: {
		adminOnly: true,
		name: 'farewell',
		description: '(Admin only) Kick starrybot itself from your guild',
		execute: buildBasicMessageCommand({
			content: 'This will delete roles created by starrybot.',
			buttons: [
				{
					customId: 'farewellConfirmation',
					label: 'I understand',
					style: 'PRIMARY',
				},
				{
					customId: 'farewellRejection',
					label: 'Cancel',
					style: 'SECONDARY',
				}
			],
		}),
	}
}
