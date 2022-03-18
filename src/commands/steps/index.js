const { daoDao } = require('./daoDao');
const { editCheck } = require('./editCheck');
const { editRoleAmount } = require('./editRoleAmount');
const { editRoleName } = require('./editRoleName');
const { handleRoleAmountEdit } = require('./handleRoleAmountEdit');
const { handleRoleNameEdit } = require('./handleRoleNameEdit');
const { farewellConfirmation } = require('./farewellConfirmation');
const { farewellRejection } = require('./farewellRejection');
const { handleCW20Entry } = require('./handleCW20Entry');
const { handleCW721Entry } = require('./handleCW721Entry');
const { hasCW20 } = require('./hasCW20');
const { hasCW721 } = require('./hasCW721');
const { needsCW20 } = require('./needsCW20');
const { promptTokenAmount } = require('./promptTokenAmount');
const { addCW20 } = require('./addCW20');
const { addCW721 } = require('./addCW721');
const { addNativeToken } = require('./addNativeToken');
const { explainTokenTypes } = require('./explainTokenTypes');
const { nativeTokenSuggestion } = require('./nativeTokenSuggestion');
const { nativeTokenJUNO } = require('./nativeTokenJUNO');
const { nativeTokenSTARS } = require('./nativeTokenSTARS');
const { removeConfirmation } = require('./removeConfirmation');
const { removeVerify } = require('./removeVerify');
const { removeRejection } = require('./removeRejection');
const { stargaze } = require('./stargaze');

/*
 * Every step included here should have export a function, e.g.
 * module.exports = {
 *    stepName: async (req, res, ctx, next) => {
 *       // All functionality
 *    }
 * }
 *
 * This function is responsible for doing whatever you want the
 * step to do, e.g. send a message, react with emojis, etc.
 * This function is also responsible for determining what to do
 * next with the chain:
 *
 * - If there's an error, use res.error(error message, optional error message override)
 * - If the chain should be resolved, use res.done(optional done message)
 * - If there's still another step, use next(getNextCommandName)
 *
 * If using next, getNextCommandName will be passed in the interaction or
 * reaction from the user, and is expected to return with the name of the
 * next command to execute. This function is what allows us to map emoji
 * reactions to specific steps.
 */

module.exports = {
  starrySteps: [
    daoDao,
    editCheck,
    editRoleAmount,
    editRoleName,
    handleRoleAmountEdit,
    handleRoleNameEdit,
    farewellConfirmation,
    farewellRejection,
    handleCW20Entry,
    handleCW721Entry,
    hasCW20,
    hasCW721,
    needsCW20,
    promptTokenAmount,
    addCW20,
    addCW721,
    addNativeToken,
    explainTokenTypes,
    nativeTokenSuggestion,
    nativeTokenJUNO,
    nativeTokenSTARS,
    removeConfirmation,
    removeRejection,
    removeVerify,
    stargaze,
  ],
}
