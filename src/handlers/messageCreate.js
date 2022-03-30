const { wizardware } = require("../commands");

async function messageCreate(interaction) {
	if (interaction.author.bot) return;

	await wizardware.continue(
		`${interaction.guildId}-${interaction.author.id}`,
		{ interaction, userInput: interaction.content }
	);
}

module.exports = {
    messageCreate,
}
