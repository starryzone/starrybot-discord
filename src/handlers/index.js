const { guildCreate } = require("../handlers/guildCreate");
const { interactionCreate } = require("../handlers/interactionCreate");
const { messageReactionAdd } = require("../handlers/messageReactionAdd");

module.exports = {
  guildCreate,
  interactionCreate,
  messageReactionAdd,
}
