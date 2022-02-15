const { createEmbed } = require("../utils/messages");

// Add
async function starryCommandTokenAdd(req, res, ctx, next) {
	const { interaction } = req;

	const msgEmbed = createEmbed({
		color: '#FDC2A0',
		title: 'One moment…',
		description: 'Loading choices, fren.',
	})
	const msg = await interaction.reply({
		embeds: [
			msgEmbed
		],
		// Necessary in order to react to the message
		fetchReply: true
	});

	await msg.react('🔗');
	await msg.react('📜');
	await msg.react('⁉');

	msg.edit({ embeds: [
			createEmbed({
				color: '#FDC2A0',
				title: 'What kind of token?',
				description: '🔗 A native token on a Cosmos chain\n\n📜 A cw20 fungible token\n\n⁉️ Huh? I\'m confused.',
			})
	] });

	// Tell the command chain handler
	// what the next step is based on
	// which emoji they reacted with
	const getCommandName = reaction => {
		// reaction._emoji will be undefined if
		// the user typed something instead
		const emojiName = reaction._emoji?.name;
		switch(emojiName) {
			case '🔗':
				return 'addNativeToken'
			case '📜':
				return 'addCW20';
			case '⁉':
				return 'explainTokenTypes';
			default:
				return;
		}
	}

	// Passing in an event handler for the user's interactions into next
	next(getCommandName);
}

module.exports = {
	starryCommandTokenAdd: {
		adminOnly: true,
		name: 'add',
		description: '(Admin only) Add a new token rule',
		execute: starryCommandTokenAdd,
	}
}
