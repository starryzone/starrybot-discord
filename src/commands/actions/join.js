const join = async (
  { guildId, userId: authorId },
  {
    db: { myConfig: {VALIDATOR: validatorURL } },
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
          author: { name: `starrybot` },
          description: results.saganism,
          title: `Please visit ${url}`,
          thumbnailUrl: 'https://starrybot.xyz/small-array-of-stars.gif',
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
};

module.exports = { join };
