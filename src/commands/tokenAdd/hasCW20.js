module.exports = {
  hasCW20: {
    name: 'hasCW20',
    config: {
      next: 'handleCW20Entry',
      prompt: {
        type: 'input',
        title: 'Enter your token address',
        description: 'Please write your cw20 token address in Discord chat…',
      }
    }
  }
}
