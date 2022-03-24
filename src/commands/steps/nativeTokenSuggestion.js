const { buildBasicMessageCommand } = require('../../utils/commands');

module.exports = {
  nativeTokenSuggestion: {
    name: 'nativeTokenSuggestion',
    execute: buildBasicMessageCommand({
      content: '🌟 Please fill out this form, friend:\n\nhttps://sfg8dsaynp1.typeform.com/to/RvAbowUd',
      done: true,
    })
  }
}
