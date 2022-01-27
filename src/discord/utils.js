const db = require("../db")
const { MessageEmbed } = require('discord.js')

let validatorURL = db.myConfig.VALIDATOR

///
/// a helper to build display ux
///

function createEmbed(traveller, saganism) {
	let url = `${validatorURL}?traveller=${traveller}`
	return new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Please visit ${url}`)
		.setURL(url)
		.setAuthor('StarryBot', 'https://i.imgur.com/AfFp7pu.png', 'https://discord.js.org')
		.setDescription(saganism)
		.setThumbnail('https://i.imgur.com/AfFp7pu.png')
		.setTimestamp()
		.setFooter('Put your helmet on', 'https://i.imgur.com/AfFp7pu.png');
}

function createWelcomeEmbed(desiredRolesForMessage) {
    return new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Enable secure slash commands`)
        .setDescription(`StarryBot just joined, and FYI there are some roles:\n- ${desiredRolesForMessage}`)
        .setImage('https://starrybot.xyz/starrybot-slash-commands2.gif');
}

module.exports = {
    createEmbed,
    createWelcomeEmbed,
}
