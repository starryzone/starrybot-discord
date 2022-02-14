const { createEmbed } = require("../../utils/messages");

// Add native token (like juno, stars…)
async function explainTokenTypes(req, res, ctx, next) {
  const { interaction } = req;

  let msgEmbed = createEmbed({
    color: '#FDC2A0',
    title: 'One moment…',
    description: 'Loading choices, fren.',
  })

  const msg = await interaction.message.reply({
    embeds: [
      msgEmbed
    ],
    // Necessary in order to react to the message
    fetchReply: true,
  });

  await msg.react('🔗');
  await msg.react('📜');
  await msg.react('⁉');

  msgEmbed = createEmbed({
    color: '#FDC2A0',
    title: "✨Pardon, lemme explain",
    description: 'What is a native token?\nA "native" token is the base token of a blockchain. For Ethereum, it\'s ether. For the Juno chain on Cosmos, it\'s juno.\n\nWhat isn\'t a native token?\nDogecoin is not a native token, it\'s a fungible token. Cosmos has fungible tokens and they\'re referred to by the name of the standard, cw20. An example might be a token created for DAO council members to vote.\n\nLet\'s try asking that again',
  })

  const repeatedTokenQuestion = createEmbed({
    color: '#FDC2A0',
    title: 'Now, what kind of token again?',
    description: '🔗 A native token on a Cosmos chain\n\n📜 A cw20 fungible token\n\n⁉️ Huh? I\'m confused.',
  })

  msg.edit({ embeds: [
    msgEmbed,
    repeatedTokenQuestion
  ]});

  const getCommandName = reaction => {
    const emojiName = reaction._emoji.name;
    switch(emojiName) {
      case '🔗':
        return 'addNativeToken'
      case '📜':
        return 'addCW20';
      case '⁉':
        return 'explainTokenTypes';
      default:
        return;
    }
  }

  // Passing in an event handler for the user's interactions into next
  next(getCommandName);
}

module.exports = {
  explainTokenTypes
}
