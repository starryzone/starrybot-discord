const { networkPrefixes } = require('../../astrolabe/networks');

const tokenAddNativePrompt = async () => {
  return {
    next: 'promptNativeToken',
    prompt: {
      type: 'button',
      title: 'Please choose from the supported Cosmos chains:',
      options: [
        ...networkPrefixes.map(prefix => ({
          value: prefix,
          label: prefix.toUpperCase()
        })),
        {
          value: `suggestion`,
          label: '🙋🏽 Suggest another!'
        }
      ]
    }
  }
}

module.exports = { tokenAddNativePrompt }