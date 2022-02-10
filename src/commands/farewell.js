const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { MessageActionRow, MessageButton } = require('discord.js')

const db = require("../db")
const { myConfig } = require("../db");

///
/// Farewell
///

async function starryCommandFarewell(interaction) {

	let appId = interaction.applicationId
	let guildId = interaction.guildId
	const rest = new REST().setToken(myConfig.DISCORD_TOKEN);

	const row = new MessageActionRow()
		.addComponents(
			new MessageButton()
				.setCustomId('farewell-confirm')
				.setLabel('I understand')
				.setStyle('PRIMARY'),
			new MessageButton()
				.setCustomId('farewell-reject')
				.setLabel('Cancel')
				.setStyle('SECONDARY'),
		)

	await interaction.reply({
		content: 'This will delete roles created by starrybot.',
		components: [row]
	});
}

module.exports = {
  starryCommandFarewell: {
    name: 'farewell',
    description: 'Kick starrybot itself from your guild',
    execute: starryCommandFarewell,
  }
}
