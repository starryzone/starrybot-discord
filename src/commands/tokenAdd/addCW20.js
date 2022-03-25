module.exports = {
  addCW20: {
    name: 'addCW20',
    config: {
      color: '#FDC2A0',
      title: 'Tell us about your token',
      emojiOptions: [
        {
          emoji: '🌠',
          description: 'Choose a token',
          next: 'hasCW20',
        },
        {
          emoji: '✨',
          description: 'I need to make a token',
          next: 'needsCW20',
        },
        {
          emoji: '☯️',
          description: 'I want (or have) a DAO with a token',
          next: 'daoDao',
        },
      ]
    }
  }
}
