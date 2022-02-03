const { continueCommandChain } = require("../commands");

///
/// A user has a command for us - resolve
///
async function handleGuildCommands(interaction) {
	const { client, channel, commandName } = interaction;
	const command = client.commands.get(commandName);

	if (!command) {
		await channel.send("Cannot find the command you asked for")
	};

	try {
		await command.execute(interaction);
	} catch (e) {
		console.warn(e);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
}

///
/// A glorious user interaction has arrived - bask in its glow
///

async function interactionCreate(interaction) {
	if (interaction.isCommand()) {
		return handleGuildCommands(interaction);
	}
	else {
		await continueCommandChain(interaction);
	}
}

module.exports = {
    interactionCreate,
}
