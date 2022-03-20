const { rolesSet } = require("../../db");

async function promptTokenName(req, res, ctx, next) {
	const {
    interaction: {
      author,
      content,
      guild,
      guildId,
   }
  } = req;
  let roleToCreate = content;
  const existingObjectRoles = await guild.roles.fetch();
  let roleAlreadyExists = existingObjectRoles.some(role => role.name === roleToCreate);
  if (roleAlreadyExists) {
    // Invalid reply
    return await res.error('A token role already exists with this name. Please pick a different name, or rename that one first.');
  }

  // Create database row
  if (ctx.tokenType === 'cw20') {
    await rolesSet(guildId, roleToCreate, ctx.tokenType, ctx.cw20, ctx.network, true, author.id, ctx.minimumTokensNeeded, ctx.decimals)
  } else if (ctx.tokenType === 'native') {
    await rolesSet(guildId, roleToCreate, ctx.tokenType, ctx.tokenSymbol, ctx.network, true, author.id, ctx.minimumTokensNeeded, ctx.decimals)
  } else {
    console.error('Unexpected tokenType', ctx.tokenType)
  }

  res.done(`You may now use the role ${roleToCreate} for token-gated channels.\n\nEnjoy, traveller!`);
}

module.exports = {
  promptTokenName,
}
