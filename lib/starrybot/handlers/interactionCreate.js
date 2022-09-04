const { wizardware } = require("../commands");

///
/// A user has a command for us - resolve
///
async function handleGuildCommands(interaction) {
	const { client, channel, commandName } = interaction;
	const command = client.commands.get(commandName);

	if (!command) {
		await channel.send("Cannot find the command you asked for, friend.")
	}

	try {
		// Called whenever you do any /starry * command
		await command.execute(interaction);
	} catch (e) {
		console.warn(e);
		await interaction.reply({
			content: 'There was an error while executing this command!',
			ephemeral: true
		});
	}
}

///
/// A glorious user interaction has arrived - bask in its glow
///

async function interactionCreate(interaction) {
	if (interaction.isCommand()) {
		// our slash commands
		return handleGuildCommands(interaction);
	} else {
		// text input, emoji reactions, or something else
		await wizardware.continue(
			`${interaction.guildId}-${interaction.user.id}`,
			'button',
			{
				interaction,
				// Reply directly to the button interaction, otherwise
				// it will not know that we've responded and will display
				// the loading animation before saying "interaction failed",
				// even when we're continuing the wizard successfully
				interactionTarget: interaction
			}
		);
	}
}

module.exports = {
    interactionCreate,
}
