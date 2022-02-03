const db = require("../db")
const logic = require("../logic")

const { createEmbed } = require("../utils/messages");

let validatorURL = db.myConfig.VALIDATOR
function createJoinEmbed(traveller, saganism) {
	let url = `${validatorURL}?traveller=${traveller}`
    return createEmbed({
        author: [`StarryBot`, `https://i.imgur.com/AfFp7pu.png`, `https://discord.js.org`],
        description: saganism,
        footer: [`Put your helmet on`, `https://i.imgur.com/AfFp7pu.png`],
        title: `Please visit ${url}`,
        thumbnailUrl: `https://i.imgur.com/AfFp7pu.png`,
        url,
    });
}

async function starryCommandJoin(req, res, ctx, next) {
const { interaction } = req;

	try {
		let results = await logic.hoistRequest({guildId: interaction.guildId, authorId: interaction.member.user.id})
		if (results.error || !results.traveller || !results.saganism) {
			res.error(results.error || "Internal error");
		} else {
			// We reply "privately" instead of sending a DM here
			await interaction.reply({embeds:[createJoinEmbed(results.traveller,results.saganism)], ephemeral: true})
			res.done();
		}
	} catch(err) {
		res.error(err, "Internal error adding you")
	}
}

module.exports = {
	starryCommandJoin: {
		name: 'join',
		description: 'Get link to verify your account with Keplr',
		execute: starryCommandJoin,
	}
}
