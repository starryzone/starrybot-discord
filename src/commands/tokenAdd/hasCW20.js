module.exports = {
  hasCW20: {
    name: 'hasCW20',
    config: {
      embeds: [
        {
          title: 'Enter your token address',
          description: 'Please write your cw20 token address in Discord chat…',
        }
      ],
      next: 'handleCW20Entry',
      prompt: {
        type: 'input',
      }
    }
  }
}
