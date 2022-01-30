const { checkInteractionWithWizard } = require("../wizard/wizard.js")

async function messageCreate (interaction) {
	if (interaction.author.bot) return;
	await checkInteractionWithWizard(interaction)
}

module.exports = {
    messageCreate,
}
