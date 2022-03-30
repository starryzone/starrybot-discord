const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')

const COLORS_BY_MESSAGE_TYPE = {
  error: '#BE75A4',
  success: '#7485FF',
  prompt: '#FDC2A0',
}

///
/// Helpers for consistent Discord UX in the bot
///
function createEmbed({
  author,
  color = '#0099ff',
  description,
  imageUrl,
  fields,
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
  if (fields) {
      embed.addFields(fields);
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
  return button;
}

function createMessageActionRow({
  components,
}) {
  const row = new MessageActionRow();
  components.forEach(component => row.addComponents(component));
  return row;
}

function createMessage({
  buttons, // TO-DO: Not a discord concept
  content,
  embeds,
  ephemeral,
  fetchReply, // Set to true if you need to react
}) {

  let componentPayload;
  if (buttons?.length > 0) {
    const row = createMessageActionRow({
      components: buttons.map(buttonConfig => createButton(buttonConfig)),
    });
    componentPayload = [row];
  }

  let embedPayload;
  if (embeds?.length > 0) {
    embedPayload = embeds.map(embed => createEmbed(embed));
  }

  // We don't use MessagePayload here because it requires passing in
  // a user first, and right now we're conveniently only ever using
  // this object in an interaction.reply
  return {
    content,
    components: componentPayload,
    embeds: embedPayload,
    ephemeral,
    fetchReply,
  };
}

function createError(errorMessage, ephemeral) {
  return createMessage({
    embeds: [
      {
        color: COLORS_BY_MESSAGE_TYPE.error,
        title: 'Error (star might be in retrograde)',
        description: errorMessage,
      }
    ],
    ephemeral,
  })
}

function createPrivateError(errorMessage) {
  return createError(errorMessage, true);
}

module.exports = {
  COLORS_BY_MESSAGE_TYPE,

  // Naive discord wrappers
  createButton,
  createEmbed,
  createMessage,
  createMessageActionRow,

  // Meaningful/reusable components
  createPrivateError,
}
