const { checkIfInteractionIsStarry, getCommandHandler } = require("../utils/commands");
const { checkInteractionWithWizard, globalUserWizards } = require("../wizard/wizard");
const {Routes} = require("discord-api-types/v9");
const db = require("../db");
const {REST} = require("@discordjs/rest");
const {myConfig} = require("../db");

async function farewellConfirmation(interaction, client) {
	let guildId = interaction.guildId

	const guild = await client.guilds.fetch(interaction.guildId)
	const roleManager = guild.roles
	const rest = new REST().setToken(myConfig.DISCORD_TOKEN);

	// find all roles to clean up
	const rolesToCleanUp = await db.rolesGetForCleanUp(guildId)
	for (let role of rolesToCleanUp) {
		try {
			let roleObj = roleManager.cache.find(r => r.name === role['give_role'])
			if (roleObj) await rest.delete(Routes.guildRole(guildId, roleObj.id))
		} catch (e) {
			console.log(`Error deleting account ${role['give_role']}`, e)
		}
	}

	// delete all the roles
	await db.rolesDeleteGuildAll(guildId)

	// confirm
	await interaction.reply('Bye!')

	// leave
	await interaction.guild.leave()
}

async function farewellRejection(interaction, client) {
	// Clean up the user's wizard
	globalUserWizards.delete(interaction.member.user.id)

	// confirm
	await interaction.reply('✨ 👍 🌟')
}

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
	let path = `${group} ${subcommand}`.trim();
	let handler = getCommandHandler(path);
	if (!handler) {
		await interaction.channel.send("Cannot find the command you asked for")
	} else {
		await handler(interaction, client)
	}
}

///
/// A glorious user interaction has arrived - bask in its glow
///

async function interactionCreate(interaction, client) {
	if (interaction.isButton()) {
		switch (interaction.customId) {
			case 'farewell-confirm':
				await farewellConfirmation(interaction, client)
				break;
			case 'farewell-reject':
				await farewellRejection(interaction, client)
				break;
		}
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
