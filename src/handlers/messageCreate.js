const { continueCommandChain } = require("../commands/index.js");

async function messageCreate(interaction) {
	if (interaction.author.bot) return;
	await continueCommandChain({sourceAction: interaction});
}

module.exports = {
    messageCreate,
}
