module.exports = {
  hasCW721: {
    next: 'handleCW721Entry',
    prompt: {
      type: 'modal',
      title: "Enter the token address",
      description: "Please write the cw721 token address in Discord chat…",
    }
  }
}
