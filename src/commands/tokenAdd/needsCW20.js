module.exports = {
  needsCW20: {
    next: 'handleCW20Entry',
    prompt: {
      type: 'input',
      title: 'Learning about cw20 tokens…',
      description: 'This info will help you understand your options.',
      fields: [
          {
            name: 'Explain cw20 tokens',
            value: 'cw20 tokens are the fungible tokens of the Cosmos ecosystem. You can see the spec here: https://github.com/CosmWasm/cw-plus/tree/main/packages/cw20',
          },
          {
            name: '\u200b', // a big space
            value: '\u200b',
            inline: false,
          },
          {
            name: 'Create your own cw20 token',
            value: 'Create your own testnet or mainnet tokens at: https://junomint.ezstaking.io',
            inline: true
          },
          {
            name: 'Or create your own DAO and cw20 token',
            value: 'Visit: https://daodao.zone',
            inline: true
          }
      ],
      footer: "🎗️ When you're finished creating your cw20 token, please type the address in this channel.",
    }
  }
}
