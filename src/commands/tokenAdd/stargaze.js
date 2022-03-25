module.exports = {
  stargaze: {
    name: 'stargaze',
    config: {
      messageType: 'prompt',
      embeds: [
        {
          title: "Paste the Stargaze URL for the NFT collection and we'll take care of the rest!",
          description: "(For example, it'll look something like https://app.stargaze.zone/launchpad/stars1lndsj2gufd292c35crv97ug2ncdcn9ys4s8e94wlxyeft6mt3k2svkwps9)",
        }
      ],
      next: 'handleCW721Entry'
    }
  },
}
