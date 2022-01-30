const { MessageActionRow, MessageButton, MessageEmbed, MessagePayload } = require('discord.js')

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

function createButton({
    customId = 'slash-commands-enabled',
    label,
    style = 'PRIMARY'
}) {
    const button = new MessageButton()
        .setCustomId(customId)
        .setStyle(style);

    if (label) {
        button.setLabel(label);
    }
    return new MessageActionRow().addComponents(button);
}

function createMessage({
    content,
    components,
    user,
}) {
    return MessagePayload.create(user, { content, components });
}

///
/// Specific embeds used by the bot
///

function createWelcomeEmbed(desiredRolesForMessage) {
    return createEmbed({
        title: `Enable secure slash commands`,
        description: `StarryBot just joined, and FYI there are some roles:\n- ${desiredRolesForMessage}`,
        imageUrl: `https://starrybot.xyz/starrybot-slash-commands2.gif`,
    });
}

function createWelcomeButton() {
    return createButton({ label: `I just did it`});
}

///
/// A helper to print the welcome message
///

function createWelcomeMessage(user, desiredRolesForMessage) {
	const embed = createWelcomeEmbed(desiredRolesForMessage)
	const row = createWelcomeButton();

	return MessagePayload.create(user, {
		content: 'Hello friends, one more step please.\nSee the GIF below…',
		embeds: [embed],
		components: [row]
	});
}

module.exports = {
    createButton,
    createEmbed,
    createMessage,

    createWelcomeMessage,
}
