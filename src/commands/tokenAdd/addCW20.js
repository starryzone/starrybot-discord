module.exports = {
  addCW20: {
    next: 'promptCW20',
    prompt: {
      type: 'button',
      title: 'Tell us about your token',
      embeds: [
        {
          title: 'Learning about CW20 tokens',
          description: 'This info will help you understand your options.',
          fields: [
              {
                name: 'Explain cw20 tokens',
                value: 'Cw20 tokens are the fungible tokens of the Cosmos ecosystem. You can see the spec here: https://github.com/CosmWasm/cw-plus/tree/main/packages/cw20.\nThese look something like this: juno19wzrmugs633kajlsupx58srmtvy65kqumhre6yn43kl58tls056s3g62gp',
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
                value: 'Visit: https://daodao.zone to find or create a new DAO. The DAODAO Url looks something like this: https://daodao.zone/dao/juno156vlvprfxc4yyu26ute4hu6tjq96pxgt5qqmm0zlt4y0khjetvhqdhmgdm',
                inline: true
              }
          ],
        }
      ],
      options: [
        {
          label: '🌠 I have a CW20 token',
          value: 'CW20',
        },
        {
          label: "☯️ I have a DAODAO URL",
          value: 'DAODAO',
        },
      ]
    }
  }
}
