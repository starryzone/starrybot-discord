const { rolesSet } = require("../../db");

async function promptTokenAmount(req, res, ctx, next) {
	const {
    interaction: {
      author,
      content,
      guild,
      guildId,
   }
  } = req;
  let amountOfTokensNeeded = content;

  if (
    !Number.isInteger(parseInt(amountOfTokensNeeded)) ||
    amountOfTokensNeeded <= 0
  ) {
    // Invalid reply
    return await res.error('Need a positive number of tokens.');
  }

  // Multiply by the decimals for native and fungible tokens
  if (ctx.tokenType === 'native' || ctx.tokenType === 'cw20') {
    console.log('Multiplying by the number of decimals', ctx.decimals)
    amountOfTokensNeeded = amountOfTokensNeeded * (10 ** ctx.decimals)
    console.log('New amount needed', amountOfTokensNeeded)
  }

  // Create role for them, but first check if it exists
  const roleToCreate = `${ctx.tokenSymbol}-hodler`;

  const existingObjectRoles = await guild.roles.fetch();
  let hasRole = existingObjectRoles.some(role => role.name === roleToCreate);

  // Create it if it doesn't exist
  if (!hasRole) {
    const newRole = await guild.roles.create({name: roleToCreate, position: 0})
    console.log('created new role with ID', newRole.id)
  }
  console.log(roleToCreate);
  // Create database row
  if (ctx.tokenType === 'cw20') {
    await rolesSet(guildId, roleToCreate, ctx.tokenType, ctx.cw20, ctx.network, true, author.id, amountOfTokensNeeded, ctx.decimals)
  } else if (ctx.tokenType === 'native') {
    await rolesSet(guildId, roleToCreate, ctx.tokenType, ctx.tokenSymbol, ctx.network, true, author.id, amountOfTokensNeeded, ctx.decimals)
  } else {
    console.error('Unexpected tokenType', ctx.tokenType)
  }

  res.done(`You may now use the role ${roleToCreate} for token-gated channels.\n\nEnjoy, traveller!`);
}

module.exports = {
  promptTokenAmount,
}
