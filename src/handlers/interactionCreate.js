const { continueWizard } = require("../wizardware");
// Useful dependencies to inject through the steps
const astrolabe = require("../astrolabe");
const daodao = require("../astrolabe/daodao");
const db = require("../db");
const logic = require("../logic");
const networks = require("../astrolabe/networks");
const stargaze = require("../astrolabe/stargaze");
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
		await command.execute(interaction, { astrolabe, daodao, db, logic, networks, stargaze });
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
		await continueWizard({sourceAction: interaction});
	}
}

module.exports = {
    interactionCreate,
}
