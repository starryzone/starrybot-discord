module.exports = {
  explainTokenTypes: {
    embeds: [
      {
        title: "✨Pardon, lemme explain",
        description: 'What is a native token?\nA "native" token is the base token of a blockchain. For Ethereum, it\'s ether. For the Juno chain on Cosmos, it\'s juno.\n\nWhat isn\'t a native token?\nDogecoin is not a native token, it\'s a fungible token. Cosmos has fungible tokens and they\'re referred to by the name of the standard, cw20. An example might be a token created for DAO council members to vote.\n\nWhat about non-fungible tokens?\nCosmos has those too, through Stargaze, and they are also referred to by the name of their standard, cw721. An example might be tokens created to represent works of art in a gallery.\n\nLet\'s try asking that again',
      },
    ],
    prompt: {
      type: 'reaction',
      title: 'Now, what kind of token again?',
      options: [
        {
          emoji: '🔗',
          description: 'A native token on a Cosmos chain',
          next: 'addNativeToken',
        },
        {
          emoji: '📜',
          description: 'A cw20 fungible token',
          next: 'addCW20',
        },
        {
          emoji: '🖼',
          description: 'A cw721 non-fungible token (Beta)',
          next: 'addCW721',
        },
        {
          emoji: '⁉',
          description: 'Huh? I\'m confused.',
          next: 'explainTokenTypes',
        }
      ]
    }
  }
}
