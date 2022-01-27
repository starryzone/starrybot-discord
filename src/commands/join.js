const logger = require("../logger")
const logic = require("../logic")

const { createJoinEmbed } = require("../utils/messaging");

async function starryCommandJoin(interaction) {
	try {
		let results = await logic.hoistRequest({guildId: interaction.guildId, authorId: interaction.member.user.id})
		if (results.error || !results.traveller || !results.saganism) {
			interaction.channel.send(results.error || "Internal error")
		} else {
			// We reply "privately" instead of sending a DM here
			return await interaction.reply({embeds:[createJoinEmbed(results.traveller,results.saganism)], ephemeral: true})
		}
	} catch(err) {
		logger.error(err)
		await interaction.channel.send("Internal error adding you")
	}
}

module.exports = {
    starryCommandJoin
}
