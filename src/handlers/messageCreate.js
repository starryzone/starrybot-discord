const { wizardware } = require("../commands");
const logger = require("../logger")

async function messageCreate(interaction) {
	logger.info('messageCreate', {
		meta: 'discordFlow',
		info: {
			interaction: JSON.stringify(interaction)
		}
	})
	if (interaction.author.bot) return;

	await wizardware.continue(
		`${interaction.guildId}-${interaction.author.id}`,
		'input',
		{
			interaction,
			// Reply to the message sent by the user
			interactionTarget: interaction,
			userInput: interaction.content
		}
	);
}

module.exports = {
    messageCreate,
}
