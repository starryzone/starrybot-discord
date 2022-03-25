const db = require("../../db")
const logic = require("../../logic")

let validatorURL = db.myConfig.VALIDATOR

module.exports = {
	starryCommandJoin: {
		name: 'join',
		description: 'Get link to verify your account with Keplr',
		config: async ({ guildId, userId: authorId }) => {
			try {
				let results = await logic.hoistRequest({ guildId, authorId });
				if (results.error || !results.traveller || !results.saganism) {
					return {
						error: results.error || "Internal error",
					};
				} else {
					let url = `${validatorURL}?traveller=${results.traveller}`

					return {
						embeds: [{
							author: [`starrybot`, `https://i.imgur.com/AfFp7pu.png`, `https://discord.js.org`],
							description: results.saganism,
							footer: [`Put your helmet on`, `https://i.imgur.com/AfFp7pu.png`],
							title: `Please visit ${url}`,
							thumbnailUrl: `https://i.imgur.com/AfFp7pu.png`,
							url,
						}],
						ephemeral: true,
					}
				}
			} catch (error) {
				return {
					error,
					channelError: "Internal error adding you"
				}
			}
		}
	}
}
