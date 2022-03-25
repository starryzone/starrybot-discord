const { rolesSet } = require("../../db");

module.exports = {
  handleRoleAmountEdit: {
    name: 'handleRoleAmountEdit',
    config: async (req, res, ctx, next) => {
      const {
        interaction: {
          author,
          content,
          guildId,
      }
      } = req;
      let amountOfTokensNeeded = content;

      if (
        !Number.isInteger(parseInt(amountOfTokensNeeded)) ||
        amountOfTokensNeeded <= 0
      ) {
        // Invalid reply
        return {
          error: 'Need a positive number of tokens.'
        }
      }

      // Multiply by the decimals for native and fungible tokens
      if (['native', 'cw20'].includes(ctx.selectedRole.token_type)) {
        amountOfTokensNeeded = amountOfTokensNeeded * (10 ** ctx.selectedRole.decimals)
      }

      // Update the database row with the new amount + same rest of data
      await rolesSet(guildId, ctx.selectedRoleName, ctx.selectedRole.token_type, ctx.selectedRole.token_address, ctx.selectedRole.network, true, author.id, amountOfTokensNeeded, ctx.selectedRole.decimals);

      return {
        doneMessage: `${ctx.selectedRoleName} has been updated to require ${amountOfTokensNeeded / (10 ** ctx.selectedRole.decimals)} tokens moving forward. Please note that this change will not apply to current hodlers of the role. \n\nEnjoy, traveller!`
      }
    }
  }
}
