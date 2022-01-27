const db = require("../db")
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')

let validatorURL = db.myConfig.VALIDATOR

///
/// Helpers for consistent Discord UX in the bot
///
function createEmbed({
    author,
    color = '#0099ff',
    description,
    imageUrl,
    footer,
    setTimestamp,
    title,
    thumbnailUrl,
    url,
}) {
    const embed = new MessageEmbed().setColor(color);
    if (author) {
        // Can be [author.name, author.thumbnailUrl, author.link]
        if (Array.isArray(author)) {
            embed.setAuthor(...author);
        }
        else {
            embed.setAuthor(author);
        }
    }
    if (description) {
        embed.setDescription(description);
    }
    if (imageUrl) {
        embed.setImage(imageUrl);
    }
    if (footer) {
        // Can be [footer.text, footer.thumbnailUrl]
        if (Array.isArray(footer)) {
            embed.setFooter(...footer);
        }
        else {
            embed.setFooter(footer);
        }
    }
    if (setTimestamp) {
        embed.setTimestamp();
    }
    if (title) {
        embed.setTitle(title);
    }
    if (thumbnailUrl) {
        embed.setThumbnail(thumbnailUrl);
    }
    if (url) {
        embed.setURL(url);
    }
    return embed;
}



///
/// Specific embeds used by the bot
///

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

function createWelcomeEmbed(desiredRolesForMessage) {
    return createEmbed({
        title: `Enable secure slash commands`,
        description: `StarryBot just joined, and FYI there are some roles:\n- ${desiredRolesForMessage}`,
        imageUrl: `https://starrybot.xyz/starrybot-slash-commands2.gif`,
    });
}

function createWelcomeButton() {
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('slash-commands-enabled')
                .setLabel("I just did it")
                .setStyle('PRIMARY'),
        );

}

function createMissingAccessButton() {
    return new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('slash-commands-enabled')
                .setLabel("I really did it this time")
                .setStyle('PRIMARY'),
        );
}

module.exports = {
    createJoinEmbed,
    createMissingAccessButton,
    createWelcomeEmbed,
    createWelcomeButton,
}
