module.exports = {
  hasCW721: {
    name: 'hasCW721',
    config: {
      next: 'handleCW721Entry',
      prompt: {
        type: 'input',
        title: "Enter the token address",
        description: "Please write the cw721 token address in Discord chat…",
      }
    }
  }
}
