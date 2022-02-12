const db = require("../db")
const { myConfig } = db;
const { createButton, createMessageActionRow } = require("../utils/messages");

///
/// Farewell
///

async function starryCommandFarewell(req, res, ctx, next) {
	const { interaction } = req;

	const row = createMessageActionRow({
		components: [
			createButton({
				customId: 'farewellConfirmation',
				label: 'I understand',
				style: 'PRIMARY',
			}),
			createButton({
				customId: 'farewellRejection',
				label: 'Cancel',
				style: 'SECONDARY',
			}),
		]
	});

	await interaction.reply({
		content: 'This will delete roles created by starrybot.',
		components: [row]
	});

	next(interaction => interaction.customId);
}

module.exports = {
	starryCommandFarewell: {
		adminOnly: true,
		name: 'farewell',
		description: 'Kick starrybot itself from your guild',
		execute: starryCommandFarewell,
	}
}
