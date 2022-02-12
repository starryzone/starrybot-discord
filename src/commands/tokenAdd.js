const { createEmbed } = require("../utils/messages");

///
/// Add
///

async function starryCommandTokenAdd(req, res, ctx, next) {
	const { interaction } = req;

	const msg = await interaction.reply({
		embeds: [
			createEmbed({
				color: '#FDC2A0',
				title: 'Tell us about your token',
				description: '🌠 Choose a token\n✨ I need to make a token\n☯️ I want (or have) a DAO with a token',
			})
		],
		// Necessary in order to react to the message
		fetchReply: true,
	});

	await msg.react('🌠');
	await msg.react('✨');
	await msg.react('☯️');

	// Tell the command chain handler
	// what the next step is based on
	// which emoji they reacted with
	const getCommandName = reaction => {
		const emojiName = reaction._emoji.name;
		switch(emojiName) {
			case '🌠':
				return 'hasCW20'
			case '✨':
				return 'needsCW20';
			case '☯️':
				return 'daoDao';
			default:
				return;
		}
	}

	// Passing in an event handler for the user's interactions into next
	next(getCommandName);
}

module.exports = {
	starryCommandTokenAdd: {
		name: 'add',
		description: 'Add a new token rule',
		execute: starryCommandTokenAdd,
	}
}
