const { createEmbed } = require("../../utils/messages");

const addTokenRuleScript = {
    step1BeginFn: {
        title: 'Tell us about your token',
        description: '🌠 Choose a token\n✨ I need to make a token\n☯️ I want (or have) a DAO with a token',
    },
    hasCW20: {
        title: 'Enter your token address',
        description: 'Please write your cw20 token address in Discord chat…',
    },
    step2BeginFn: {
        title: 'How many tokens?',
        description: 'Please enter the number of tokens a user must have to get a special role.',
        footer: 'Note: this role will be created automatically',
    },
    needsCW20: {
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
    daoDao: {
        title: 'Check out DAODAO',
        description: "If you haven't set up a DAO, visit the link above to create a DAO with a governance token.",
        fields: [
          {
            name: '🧑‍🤝‍🧑', // a big space
            value: '☯',
            inline: false,
          },
          {
            name: "Paste your DAODAO URL and we'll take care of the rest!",
            value: "(For example, it'll look something like https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld)",
          }
        ],
        url: 'https://daodao.zone'
    }
}

function createAddTokenEmbed (stepName) {
    const step = addTokenRuleScript[stepName];
    if (step) {
        return createEmbed({
            color: '#FDC2A0',
            title: step.title,
            description: step.description,
            fields: step.fields,
            footer: step.footer,
            url: step.url,
        });
    }
}

module.exports = {
    createAddTokenEmbed,
}
