const { buildBasicMessageCommand } = require('../../utils/commands');

module.exports = {
  farewellRejection: {
    name: 'farewellRejection',
    execute: buildBasicMessageCommand({
      content: '✨ 👍 🌟',
      done: true,
    })
  }
}
