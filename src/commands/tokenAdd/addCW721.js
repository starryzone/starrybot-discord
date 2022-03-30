const { createEmbed } = require("../../utils/messages");

// Add cw721 non-fungible token collection
async function addCW721(req, res, ctx, next) {
  const { interaction } = req;

  const msgEmbed = createEmbed({
    color: '#FDC2A0',
    title: 'One moment…',
    description: 'Loading choices, fren.',
  })
  const msg = await interaction.message.reply({
    embeds: [
      msgEmbed
    ],
    // Necessary in order to react to the message
    fetchReply: true
  });

  await msg.react('🖼');
  await msg.react('💫');

  msg.edit({ embeds: [
      createEmbed({
        color: '#FDC2A0',
        title: 'Tell us about the NFT',
        description: '🖼 I have the token address\n\n💫 I have the Stargaze Launchpad URL',
      })
    ] });

  // Tell the command chain handler
  // what the next step is based on
  // which emoji they reacted with
  const getCommandName = reaction => {
    const emojiName = reaction._emoji.name;
    switch(emojiName) {
      case '🖼':
        return 'hasCW721'
      case '💫':
        return 'stargaze';
      default:
        return;
    }
  }

  // Passing in an event handler for the user's interactions into next
  next(getCommandName);
}

module.exports = {
  addCW721
}
