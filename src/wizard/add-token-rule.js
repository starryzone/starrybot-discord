const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const TESTNET_RPC_ENDPOINT = process.env.TESTNET_RPC_ENDPOINT
const MAINNET_RPC_ENDPOINT = process.env.MAINNET_RPC_ENDPOINT

const { rolesSet } = require("../db");
const { checkForCW20, checkForDAODAODAO } = require("../token");

const AddTokenRuleWizardConfig = {
  steps: [
    // First step: getting the cw20 address
    {
      interactionType: 'reaction',
      beginWithMessage: {
        type: 'interaction',
        embedArgs: {
          title: 'Tell us about your token',
          description: '🌠 Choose a token\n✨ I need to make a token\n☯️ I want (or have) a DAO with a token',
        }
      },
      // 3 possible options: either you know your cw20, you're making one, or you have your DAODAO URL
      options: [
        {
          optionName: 'hasCW20',
          emoji: '🌠',
          embedArgs: {
            title: 'Enter your token address',
            description: 'Please write your cw20 token address in Discord chat…',
          },
          resultFn: handleCW20Entry,
        },
        {
          optionName: 'needsCW20',
          emoji: '✨',
          embedArgs: {
            title: 'Learning about cw20 tokens…',
            description: 'This info will help you understand your options.',
            fields: [
                {
                  name: 'Explain cw20 tokens',
                  value: 'cw20 tokens are the fungible tokens of the Cosmos ecosystem. You can see the spec here: https://github.com/CosmWasm/cw-plus/tree/main/packages/cw20',
                },
                {
                  name: '\u200b', // a big space
                  value: '\u200b',
                  inline: false,
                },
                {
                  name: 'Create your own cw20 token',
                  value: 'Create your own testnet or mainnet tokens at: https://junomint.ezstaking.io',
                  inline: true
                },
                {
                  name: 'Or create your own DAO and cw20 token',
                  value: 'Visit: https://daodao.zone',
                  inline: true
                }
            ],
            footer: "🎗️ When you're finished creating your cw20 token, please type the address in this channel.",
          },
          resultFn: handleCW20Entry,
        },
        {
          optionName: 'daoDao',
          emoji: '☯️',
          embedArgs: {
            title: 'Check out DAODAO',
            description: "If you haven't set up a DAO, visit the link above to create a DAO with a governance token.",
            fields: [
              {
                name: '🧑‍🤝‍🧑', // a big space
                value: '☯',
                inline: false,
              },
              {
                name: "Paste your DAODAO URL and we'll take care of the rest!",
                value: "(For example, it'll look something like https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld)",
              }
            ],
            url: 'https://daodao.zone'
          },
          resultFn: handleCW20Entry,
        }
      ]
    },
    // Second step: input how many of these tokens the user needs, add to db
    {
      interactionType: 'text',
      beginWithMessage: {
        embedArgs: {
          title: 'How many tokens?',
          description: 'Please enter the number of tokens a user must have to get a special role.',
          footer: 'Note: this role will be created automatically',
        }
      },
      resultFn: async (parentWizard, { interaction }, ...extra) => {
        const amountOfTokensNeeded = interaction.content
        if (!Number.isInteger(parseInt(amountOfTokensNeeded)) || amountOfTokensNeeded <= 0 ) {
          // Invalid reply
          return await parentWizard.failure('Need a positive number of tokens.')
        }

        // Create role for them, but first check if it exists
        const roleToCreate = `${parentWizard.state.tokenSymbol}-hodler`

        const guild = await parentWizard.client.guilds.fetch(parentWizard.guildId)
        const existingObjectRoles = await guild.roles.fetch();

        // TODO: use filter or map or other fun JS stuff
        let hasRole = false
        for (let role of existingObjectRoles.values()) {
          if (role.name === roleToCreate) {
            hasRole = true
            break
          }
        }

        // Create it if it doesn't exist
        if (!hasRole) {
          const newRole = await guild.roles.create({name: roleToCreate, position: 0})
          console.log('created new role with ID', newRole.id)
        }

        // Create database row
        // TODO: remember to make the "testnet" entry here not hardcoded, waiting for DAODAO mainnet
        await rolesSet(parentWizard.guildId, roleToCreate, 'cw20', parentWizard.state.cw20, parentWizard.state.network, true, interaction.author.id, amountOfTokensNeeded)
        parentWizard.done(`You may now use the role ${roleToCreate} for token-gated channels.\n\nEnjoy, traveller!`)
      }
    }
  ]
}

async function handleCW20Entry (parentWizard, {interaction}, ...extra) {
  console.log('aloha interaction', interaction)
  console.log('aloha interaction.content', interaction.content)
  // We may modify this, but for now we're just dealing with text inputs
  if (parentWizard.currentStep.interactionType !== 'text') return;

  // Check to see if they pasted a DAODAO URL like this:
  // https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld
  let network = 'mainnet'
  let cw20Input, tokenInfo, cosmClient, daoInfo
  try {
    if (interaction.content.startsWith('https://daodao.zone')) {
      cosmClient = await CosmWasmClient.connect(MAINNET_RPC_ENDPOINT)
      daoInfo = await checkForDAODAODAO(parentWizard, cosmClient, interaction.content, true)
      if (daoInfo === false) {
        network = 'testnet'
        cosmClient = await CosmWasmClient.connect(TESTNET_RPC_ENDPOINT)
        daoInfo = await checkForDAODAODAO(parentWizard, cosmClient, interaction.content, false)
      }

      // If there isn't a governance token associated with this DAO, fail with message
      if (!daoInfo || !daoInfo.hasOwnProperty('gov_token')) {
        return await parentWizard.failure("We couldn't find any governance token associated with your DAO :/\nPerhaps destroyed in a supernova?");
      }
      cw20Input = daoInfo['gov_token']
      // Now that we have the cw20 token address and network, get the info we want
      tokenInfo = await checkForCW20(parentWizard, cosmClient, cw20Input, false)
    } else {
      // Check user's cw20 token for existence on mainnet then testnet
      cw20Input = interaction.content;
      cosmClient = await CosmWasmClient.connect(MAINNET_RPC_ENDPOINT)
      tokenInfo = await checkForCW20(parentWizard, cosmClient, cw20Input, true)
      if (tokenInfo === false) {
        // Nothing was found on mainnet, try testnet
        network = 'testnet'
        cosmClient = await CosmWasmClient.connect(TESTNET_RPC_ENDPOINT)
        tokenInfo = await checkForCW20(parentWizard, cosmClient, cw20Input, false)
      }
    }
  } catch (e) {
    console.warn(e);
    return await parentWizard.failure(`Sorry, something went wrong. Please try again.`);
  }

  if (!tokenInfo) {
    // Error happened, but wizard failure message already occurred
    //   as well as cleanup. Simply return.
    return;
  }

  // At this point we have the network and token info
  parentWizard.state.cw20 = cw20Input
  parentWizard.state.network = network
  parentWizard.state.tokenSymbol = tokenInfo.symbol
  // Move to step 2
  parentWizard.currentStep = parentWizard.steps[1]
  parentWizard.currentStep.beginFn({ interaction: null })
}

module.exports = {
  AddTokenRuleWizardConfig
}
