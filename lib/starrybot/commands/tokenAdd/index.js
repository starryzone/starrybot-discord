const { addCW20 } = require('./addCW20');
const { addCW721 } = require('./addCW721');
const { addNativeToken } = require('./addNativeToken');
const { daoDao } = require('./daoDao');
const { explainTokenTypes } = require('./explainTokenTypes');
const { handleCW20Entry } = require('./handleCW20Entry');
const { handleCW721Entry } = require('./handleCW721Entry');
const { hasCW20 } = require('./hasCW20');
const { hasCW721 } = require('./hasCW721');
const { nativeTokenJUNO } = require('./nativeTokenJUNO');
const { nativeTokenSTARS } = require('./nativeTokenSTARS');
const { nativeTokenSuggestion } = require('./nativeTokenSuggestion');
const { needsCW20 } = require('./needsCW20');
const { promptTokenAmount } = require('./promptTokenAmount');
const { promptTokenName } = require('./promptTokenName');
const { handleStakedOnlyNo } = require('./handleStakedOnlyNo');
const { handleStakedOnlyYes } = require('./handleStakedOnlyYes');
const { stargaze } = require('./stargaze');

module.exports = {
  starryCommandTokenAdd: {
    adminOnly: true,
    name: 'add',
    description: 'Add a new token rule',
    prompt: {
      type: 'reaction',
      title: 'What kind of token?',
      options: [
        {
          emoji: '🔗',
          description: 'A native token on a Cosmos chain',
          next: 'addNativeToken',
        },
        {
          emoji: '📜',
          description: 'A cw20 fungible token',
          next: 'addCW20',
        },
        {
          emoji: '🖼',
          description: 'A cw721 non-fungible token (Beta)',
          next: 'addCW721',
        },
        {
          emoji: '⁉',
          description: 'Huh? I\'m confused.',
          next: 'explainTokenTypes',
        }
      ]
    },
    steps: {
      addCW20,
      addCW721,
      addNativeToken,
      daoDao,
      explainTokenTypes,
      handleCW20Entry,
      handleCW721Entry,
      hasCW20,
      hasCW721,
      nativeTokenJUNO,
      nativeTokenSTARS,
      nativeTokenSuggestion,
      needsCW20,
      promptTokenAmount,
      promptTokenName,
      stargaze,
      handleStakedOnlyNo,
      handleStakedOnlyYes,
    }
  }
}
