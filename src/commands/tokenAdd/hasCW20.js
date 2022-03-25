module.exports = {
  hasCW20: {
    name: 'hasCW20',
    config: {
      messageType: 'prompt',
      embeds: [
        {
          title: 'Enter your token address',
          description: 'Please write your cw20 token address in Discord chat…',
        }
      ],
      next: 'handleCW20Entry',
    }
  }
}
