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
  const amountOfTokensNeeded = content;

  if (
    !Number.isInteger(parseInt(amountOfTokensNeeded)) ||
    amountOfTokensNeeded <= 0
  ) {
  // Invalid reply
    return await res.error('Need a positive number of tokens.');
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
  // TODO: remember to make the "testnet" entry here not hardcoded, waiting for DAODAO mainnet
  await rolesSet(guildId, roleToCreate, 'cw20', ctx.cw20, ctx.network, true, author.id, amountOfTokensNeeded)

  res.done(`You may now use the role ${roleToCreate} for token-gated channels.\n\nEnjoy, traveller!`);
}

module.exports = {
  promptTokenAmount,
}
