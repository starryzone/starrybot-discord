const { addCW20 } = require('./addCW20');
const { addCW721 } = require('./addCW721');
const { addNativeToken } = require('./addNativeToken');
const { daoDao } = require('./daoDao');
const { hasCW20 } = require('./hasCW20');
const { hasCW721 } = require('./hasCW721');
const { promptNativeToken } = require('./promptNativeToken');
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
      type: 'select',
      title: 'What kind of token?',
      options: [
        {
          label: '🔗 Native Token',
          // FYI 100 char limit
          description: `E.g. Ether for Etherum, Juno for the Juno chain.`,
          next: 'addNativeToken',
        },
        {
          label: '📜 CW20 fungible token',
          description: `E.g. Governance tokens that let DAO council members vote.`,
          next: 'addCW20',
        },
        {
          label: '🎨 CW721 non-fungible token (Beta)',
          description: `E.g. Stargaze tokens for works of art.`,
          next: 'addCW721',
        },
      ]
    },
    steps: {
      addCW20,
      addCW721,
      addNativeToken,
      daoDao,
      hasCW20,
      hasCW721,
      promptNativeToken,
      promptTokenName,
      stargaze,
      handleStakedOnlyNo,
      handleStakedOnlyYes,
    }
  }
}
