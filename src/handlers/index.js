const { guildCreate } = require("../handlers/guildCreate");
const { interactionCreate } = require("../handlers/interactionCreate");
const { messageCreate } = require("../handlers/messageCreate");
const { messageReactionAdd } = require("../handlers/messageReactionAdd");

module.exports = {
  guildCreate,
  interactionCreate,
  messageCreate,
  messageReactionAdd,
}
