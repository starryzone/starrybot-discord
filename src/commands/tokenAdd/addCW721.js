module.exports = {
  addCW721: {
    name: 'addCW721',
    config: {
      messageType: 'prompt',
      title: 'Tell us about your token',
      emojiOptions: [
        {
          emoji: '🖼',
          description: 'I have the token address',
          next: 'hasCW721',
        },
        {
          emoji: '💫',
          description: 'I have the Stargaze Launchpad URL',
          next: 'stargaze',
        },
      ]
    }
  }
}
