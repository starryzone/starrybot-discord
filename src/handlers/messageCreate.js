const { wizardController } = require("../commands");

async function messageCreate(interaction) {
	if (interaction.author.bot) return;

	await wizardController.continue(
		`${interaction.guildId}-${interaction.author.id}`,
		{ interaction, userInput: interaction.content }
	);
}

module.exports = {
    messageCreate,
}
