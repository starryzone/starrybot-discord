const { farewellConfirmation } = require('./farewellConfirmation');
const { farewellRejection } = require('./farewellRejection');

module.exports = {
  starryCommandFarewell: {
    adminOnly: true,
    name: 'farewell',
    description: 'Kick starrybot itself from your guild',
    prompt: {
      type: 'button',
      title: 'This will delete roles created by starrybot.',
      options: [
        {
          next: 'farewellConfirmation',
          label: 'I understand',
        },
        {
          next: 'farewellRejection',
          label: 'Cancel',
          style: 'SECONDARY',
        }
      ]
    },
    steps: {
      farewellConfirmation,
      farewellRejection,
    }
  }
}
