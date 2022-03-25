const { buildBasicMessageCommand } = require('../../utils/commands');

module.exports = {
  hasCW721: {
    name: 'hasCW721',
    config: {
      embeds: [
        {
          color: '#FDC2A0',
          title: "Enter the token address",
          description: "Please write the cw721 token address in Discord chat…",
        }
      ],
      next: 'handleCW721Entry',
    }
  }
}
