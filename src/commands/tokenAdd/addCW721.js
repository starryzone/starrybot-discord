module.exports = {
  addCW721: {
    next: 'promptCW721',
    prompt: {
      type: 'button',
      title: 'Tell us about your token',
      embeds: [
        {
          title: 'Learning about CW721 tokens',
          description: 'This info will help you understand your options.',
          fields: [
            {
              name: 'Explain cw721 tokens',
              value: 'Cw721 tokens are the non-fungible tokens of the Cosmos ecosystem. They look something like this: stars1n08lr7w2tkpd8m79hmt3ex7076awk77qysdzlg70a35agwzznwzqwgfq0j'
            },
            {
              name: '\u200b', // a big space
              value: '\u200b',
              inline: false,
            },
            {
              name: 'Stargaze Launchpad',
              value: 'If you know the Launchpad URL for the NFT collection you would like to make a token rule for, we can use that instead! It should look something like this: https://app.stargaze.zone/launchpad/stars1lndsj2gufd292c35crv97ug2ncdcn9ys4s8e94wlxyeft6mt3k2svkwps9',
              inline: true
            }
          ]
        }
      ],
      options: [
        {
          label: '🎨 I have a CW721 token',
          value: 'CW721',
        },
        {
          label: '💫  I have a Stargaze Launchpad URL',
          value: 'Stargaze',
        },
      ]
    }
  }
}
