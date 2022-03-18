const { getTokenDetails } = require('../../astrolabe')
const { rolesSet } = require("../../db");

async function handleCW721Entry(req, res, ctx, next) {
	const { interaction } = req;
  const { author, guild, guildId } = interaction;

  const userInput = interaction.content;
  // If user has done something else (like emoji reaction) do nothing
  if (!userInput) return;

  let results;
  try {
    results = await getTokenDetails(userInput);
  } catch (e) {
    // Notify the channel with whatever went wrong in this step
    return await res.error(e);
  }

  // Create role for them, but first check if it exists
  const roleToCreate = `${results.tokenSymbol}-hodler`;

  const existingObjectRoles = await guild.roles.fetch();
  let hasRole = existingObjectRoles.some(role => role.name === roleToCreate);

  // Create it if it doesn't exist
  if (!hasRole) {
    const newRole = await guild.roles.create({name: roleToCreate, position: 0})
    console.log('created new role with ID', newRole.id)
  }

  // Create database row
  await rolesSet(guildId, roleToCreate, results.tokenType, results.cw721, results.network, true, author.id, 1, results.decimals)

  res.done(`You may now use the role ${roleToCreate} for token-gated channels.\n\nEnjoy, traveller!`);
}

module.exports = {
  handleCW721Entry,
}
