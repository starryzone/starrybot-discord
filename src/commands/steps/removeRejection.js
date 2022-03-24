const { buildBasicMessageCommand } = require('../../utils/commands');

module.exports = {
  removeRejection: {
    name: 'removeRejection',
    execute: buildBasicMessageCommand({
      content: '✨ 👍 🌟',
      done: true,
    })
  }
}
