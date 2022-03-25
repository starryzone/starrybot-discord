module.exports = {
  addCW721: {
    name: 'addCW721',
    config: {
      title: 'Tell us about your token',
      prompt: {
        type: 'reaction',
        options: [
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
}
