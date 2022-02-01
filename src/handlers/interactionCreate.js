const { checkIfInteractionIsStarry, getCommandHandler } = require("../utils/commands");
const { checkInteractionWithWizard } = require("../wizard/wizard");

///
/// A user has a command for us - resolve
///
async function handleGuildCommands(interaction, client) {
	// only observe "/starry *" commands
	if (!checkIfInteractionIsStarry(interaction)) {
		return
	}
    let group = interaction.options['_group'] || "";
    let subcommand = interaction.options['_subcommand'];
	let path =  `${group} ${subcommand}`.trim();
	let handler = getCommandHandler(path);
	if(!handler) {
		await interaction.channel.send("Cannot find the command you asked for")
		return
	} else {
		await handler(interaction, client)
	}
}

///
/// A glorious user interaction has arrived - bask in its glow
///

async function interactionCreate(interaction, client) {
	if (interaction.isButton()) {
		// Note: The simplified auth flow results in the bot no longer
		// using any buttons, but we may want them in the future.
		// if (interaction.customId === 'slash-commands-enabled') {}
	} else if (interaction.isCommand()) {
		return handleGuildCommands(interaction, client)
	} else {
		await checkInteractionWithWizard(interaction)
		console.error('Interaction is NOT understood!')
		console.error(interaction)
	}
}

module.exports = {
    interactionCreate,
}
