const { continueWizard } = require("../wizardware");

async function messageCreate(interaction) {
	if (interaction.author.bot) return;
	await continueWizard({sourceAction: interaction});
}

module.exports = {
    messageCreate,
}
