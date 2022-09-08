const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  SelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js')

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
  const embed = new EmbedBuilder().setColor(color);
  if (author) {
    // Expected to be an object like: { name, iconUrl, url }
    embed.setAuthor(author);
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
    if (typeof footer === 'object') {
      embed.setFooter(footer);
    } else {
      embed.setFooter({ text: footer });
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
  style = 'Primary'
}) {
  typeof ButtonStyle
  const button = new ButtonBuilder()
      .setCustomId(customId)
      // TO-DO: This condition isn't necessary in typescript
      // https://stackoverflow.com/questions/50417254/dynamically-access-enum-in-typescript-by-key
      .setStyle(style === 'Primary' ? ButtonStyle.Primary : ButtonStyle.Secondary);

  if (label) {
      button.setLabel(label);
  }
  return button;
}

function createActionRow({
  components,
}) {
  const row = new ActionRowBuilder();
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
    const row = createActionRow({
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

function createSelectMenu({
  customId = 'starrybot-select-menu',
  embeds = [],
  placeholder = 'Select an option',
  options = [], // each need a label, description, and value
  title,
}) {
  const row = new ActionRowBuilder()
    .addComponents(
      new SelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .addOptions(...options.map(option => ({
          // Only first 100 char allowed
          ...option,
          description: option.description?.substring(0, 100),
        }))), // Supposed to be different args
  );

  return {
    content: title,
    embeds: embeds.map(embed => createEmbed(embed)),
    components: [row],
  };
}

function createModal({
  customId = 'starrybot-modal-prompt',
  title,
  inputs = [],
}) {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title);

  // Create a Text Input component for each input
  // we'd like in our form
  // https://discordjs.guide/interactions/modals.html#input-properties
  const textInputs = inputs.map((input, index) => (
    new TextInputBuilder()
      .setCustomId(input.id || `input-${index}`) // TO-DO allow custom IDs to get passed through
      .setPlaceholder(input.placeholder || '')
      .setRequired(input.required || false)
      .setLabel(input.label || '')
      // can be Short, Paragraph
      .setStyle(input.style === 'Short' ? TextInputStyle.Short : TextInputStyle.Paragraph)
  ));

  // Create an action row for each Text Input
  const actionRows = textInputs.map(textInput => (
    new ActionRowBuilder().addComponents(textInput)
  ));

  if (actionRows.length > 0) {
    modal.addComponents(...actionRows);
  }

  return modal;
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
  createActionRow,
  createButton,
  createEmbed,
  createMessage,
  createModal,
  createSelectMenu,

  // Meaningful/reusable components
  createPrivateError,
}
