const { createEmbed } = require("../../utils/messages");

// Add cw2o fungible token
async function addCW20(req, res, ctx, next) {
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

  await msg.react('🌠');
  await msg.react('✨');
  await msg.react('☯️');

  msg.edit({ embeds: [
      createEmbed({
        color: '#FDC2A0',
        title: 'Tell us about your token',
        description: '🌠 Choose a token\n\n✨ I need to make a token\n\n☯️ I want (or have) a DAO with a token',
      })
    ] });

  // Tell the command chain handler
  // what the next step is based on
  // which emoji they reacted with
  const getCommandName = reaction => {
    const emojiName = reaction._emoji.name;
    switch(emojiName) {
      case '🌠':
        return 'hasCW20'
      case '✨':
        return 'needsCW20';
      case '☯️':
        return 'daoDao';
      default:
        return;
    }
  }

  // Passing in an event handler for the user's interactions into next
  next(getCommandName);
}

module.exports = {
  addCW20
}
