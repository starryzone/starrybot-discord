module.exports = {
  addCW721: {
    prompt: {
      type: 'select',
      title: 'Tell us about your token',
      options: [
        {
          label: '🎨 I have a CW721 token',
          description: 'E.g. stars1n08lr7w2tkpd8m79hmt3ex7076awk77qysdzlg70a35agwzznwzqwgfq0j',
          next: 'hasCW721',
        },
        {
          label: '💫  I have a Stargaze Launchpad URL',
          description: 'E.g. https://app.stargaze.zone/launchpad/stars1lndsj2gufd292c35crv97ug2ncdcn9ys4s8e94wlxyeft6mt3k2svkwps9',
          next: 'stargaze',
        },
      ]
    }
  }
}
