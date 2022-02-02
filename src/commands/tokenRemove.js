const { createEmbed } = require("../utils/messages");

async function starryCommandTokenRemove(interaction) {
    if (interaction) {
        return await interaction.reply({
            embeds: [
              createEmbed({
                  title: 'This feature is a few light years away',
                  description: 'Please come back later!'
              })
            ],
            ephemeral: true
        })
    }
}

module.exports = {
  starryCommandTokenRemove: {
    name: 'remove',
    description: 'Remove token rule',
    execute: starryCommandTokenRemove,
  }
}
