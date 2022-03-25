const { farewellConfirmation } = require('./farewellConfirmation');
const { farewellRejection } = require('./farewellRejection');

module.exports = {
	starryCommandFarewell: {
		adminOnly: true,
		name: 'farewell',
		description: '(Admin only) Kick starrybot itself from your guild',
		config: {
			message: 'This will delete roles created by starrybot.',
			prompt: {
				type: 'button',
				options: [
					{
						next: 'farewellConfirmation',
						label: 'I understand',
						style: 'PRIMARY',
					},
					{
						next: 'farewellRejection',
						label: 'Cancel',
						style: 'SECONDARY',
					}
				]
			},
		},
		steps: [
			farewellConfirmation,
			farewellRejection,
		]
	}
}
