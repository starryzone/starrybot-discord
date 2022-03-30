module.exports = {
  starryCommandJoin: {
    name: 'join',
    description: 'Get link to verify your account with Keplr',
    getConfig: async (
      { guildId, userId: authorId },
      {
        db: { myConfig: { VALIDATOR: validatorURL } },
        logic: { hoistRequest }
      }
    ) => {
      try {
        let results = await hoistRequest({ guildId, authorId });
        if (results.error || !results.traveller || !results.saganism) {
          return {
            error: results.error || "Internal error",
          };
        } else {
          let url = `${validatorURL}?traveller=${results.traveller}`

          return {
            ephemeral: true,
            done: {
              author: [`starrybot`, `https://i.imgur.com/AfFp7pu.png`, `https://discord.js.org`],
              description: results.saganism,
              footer: [`Put your helmet on`, `https://i.imgur.com/AfFp7pu.png`],
              title: `Please visit ${url}`,
              thumbnailUrl: `https://i.imgur.com/AfFp7pu.png`,
              url,
            }
          }
        }
      } catch (error) {
        return {
          error,
          channelError: "Internal error adding you"
        }
      }
    }
  }
}
