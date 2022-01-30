const { createEmbed } = require("../../utils/messages");

const addTokenRuleScript = {
    promptForTokenInfo: {
        title: 'Tell us about your token',
        description: '🌠 Choose a token\n✨ I need to make a token\n☯️ I want (or have) a DAO with a token',
    },
    promptForCW20: {
        title: 'Enter your token address',
        description: 'Please write your cw20 token address in Discord chat…',
    },
    promptForTokenAmount: {
        title: 'How many tokens?',
        description: 'Please enter the number of tokens a user must have to get a special role.',
        footer: 'Note: this role will be created automatically',
    },
    explainCW20: {
        title: 'Learning about cw20 tokens…',
        description: 'This info will help you understand your options.',
        fields: [
            {
              name: 'Explain cw20 tokens',
              value: 'cw20 tokens are the fungible tokens of the Cosmos ecosystem. You can see the spec here: https://github.com/CosmWasm/cw-plus/tree/main/packages/cw20',
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
              value: 'Visit: https://daodao.zone',
              inline: true
            }
        ],
        footer: "🎗️ When you're finished creating your cw20 token, please type the address in this channel."
    },
}

function createAddTokenEmbed (sceneName) {
    const scene = addTokenRuleScript[sceneName];
    if (scene) {
        return createEmbed({
            color: '#FDC2A0',
            title: scene.title,
            description: scene.description,
            fields: scene.fields,
            footer: scene.footer,
        });
    }
}

module.exports = {
    createAddTokenEmbed,
}
