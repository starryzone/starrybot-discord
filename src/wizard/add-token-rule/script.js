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
    }
}

function createAddTokenEmbed (sceneName) {
    const scene = addTokenRuleScript[sceneName];
    if (scene) {
        return createEmbed({
            color: '#FDC2A0',
            title: scene.title,
            description: scene.description,
            footer: scene.footer,
        });
    }
}

module.exports = {
    createAddTokenEmbed,
}
