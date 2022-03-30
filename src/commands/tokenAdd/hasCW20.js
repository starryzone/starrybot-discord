module.exports = {
  hasCW20: {
    next: 'handleCW20Entry',
    prompt: {
      type: 'input',
      title: 'Enter your token address',
      description: 'Please write your cw20 token address in Discord chat…',
    }
  }
}
