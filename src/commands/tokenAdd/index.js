const { addCW20 } = require('./addCW20');
const { addCW721 } = require('./addCW721');
const { addNativeToken } = require('./addNativeToken');
const { createTokenRule } = require('./createTokenRule');
const { promptCW20 } = require('./promptCW20');
const { promptCW721 } = require('./promptCW721');
const { promptNativeToken } = require('./promptNativeToken');
const { handleRoleCreate } = require('./handleRoleCreate');

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
          description: `E.g. Juno for the Juno chain.`,
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
      createTokenRule,
      handleRoleCreate,
      promptCW20,
      promptCW721,
      promptNativeToken,
    }
  }
}
