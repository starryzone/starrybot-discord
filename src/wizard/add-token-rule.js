const { Wizard, WizardStep } = require("./wizard.js")
const { rolesSet } = require("../db")
const { MessageEmbed } = require("discord.js");
const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const TESTNET_RPC_ENDPOINT = process.env.TESTNET_RPC_ENDPOINT || 'https://rpc.uni.juno.deuslabs.fi/'
const MAINNET_RPC_ENDPOINT = process.env.MAINNET_RPC_ENDPOINT || 'https://rpc-juno.itastakers.com/'

class WizardAddTokenRule extends Wizard {
  constructor(guildId, channelId, userId, client) {
    super();
    // Add first step (getting the cw20 address)
    let step = createStep1(userId, this)
    this.addStep(step)
    // Add second step (input how many of these tokens the user needs, add to db)
    step = createStep2(userId, this)
    this.addStep(step)
    this.currentStep = this.steps[0]
    this.discordUserId = userId
    this.channelId = channelId
    this.guildId = guildId
    this.client = client
  }
}

function createStep1(userId, parentWizard) {
  let step = new WizardStep(
    parentWizard,
      'reaction',
    null,
    async({ interaction }, ...extra) => {
      const msg = await interaction.reply(
        { embeds: [
            new MessageEmbed()
              .setColor('#FDC2A0')
              .setTitle('Tell us about your token')
              .setDescription('🌠 Choose a token\n✨ I need to make a token\n☯️ I want (or have) a DAO with a token')
          ],
          fetchReply: true
        }
      )
      try {
        await msg.react('🌠');
        await msg.react('✨');
        await msg.react('☯️');
      } catch (error) {
        console.error('One of the emojis failed to react:', error);
      }
      return msg
    },
    async({ interaction }, ...extra) => {
      if (extra.length === 0) {
        console.error('Expected an emojiName field in extra args');
        return;
      }
      const emojiName = extra[0]

      switch (emojiName) {
        case '🌠':
          // Set it to the new step, then execute the begin function
          parentWizard.currentStep = parentWizard.steps[0]['optionSteps']['hasCW20']
          parentWizard.currentStep.beginFn({ interaction: null })
          break;
        case '✨':
          parentWizard.currentStep = parentWizard.steps[0]['optionSteps']['needsCW20']
          parentWizard.currentStep.beginFn({ interaction: null })
          break;
        case '☯️':
          parentWizard.currentStep = parentWizard.steps[0]['optionSteps']['daoDao']
          parentWizard.currentStep.beginFn({ interaction: null })
          break;
        default:
          console.warn('User did not pick an applicable emoji')
      }
    }
  )

  // This will check mainnet or testnet for the existence and balance of the cw20 contract
  // gracefulExit is useful when we check if it's on mainnet first, then testnet.
  //   if it's not on mainnet, we don't want it to fail, basically
  const checkForCW20 = async (cosmClient, cw20Input, gracefulExit) => {
    let tokenInfo
    try {
      tokenInfo = await cosmClient.queryContractSmart(cw20Input, {
        token_info: { },
      })
    } catch (e) {
      const chainId = await cosmClient.getChainId()
      console.error(`rror message after trying to query cw20 on ${chainId}`, e.message)
      if (e.message.includes('decoding bech32 failed')) {
        return await parentWizard.failure('Invalid address. Remember: first you copy, then you paste.')
      } else if (e.message.includes('contract: not found')) {
        if (gracefulExit) return false
        return await parentWizard.failure('No contract at that address. Potential black hole.')
      } else if (e.message.includes('Error parsing into type')) {
        if (gracefulExit) return false
        return await parentWizard.failure('That is a valid contract, but cosmic perturbations tell us it is not a cw20.')
      }
    }
    return tokenInfo
  }

  const checkForDAODAODAO = async (cosmClient, daoDAOUrl, gracefulExit) => {
    let daoInfo
    try {
      const splitUrl = daoDAOUrl.split('/')
      const daoAddress = splitUrl[splitUrl.length -1]
      console.log('daoAddress', daoAddress)
      daoInfo = await cosmClient.queryContractSmart(daoAddress, {
        get_config: { },
      })
      console.log('daoInfo', daoInfo)
    } catch (e) {
      const chainId = await cosmClient.getChainId()
      console.error(`Error message after trying to query daodao dao on ${chainId}`, e.message)
      // TODO: reduce copy pasta
      if (e.message.includes('decoding bech32 failed')) {
        return await parentWizard.failure('Invalid address. Remember: first you copy, then you paste.')
      } else if (e.message.includes('contract: not found')) {
        if (gracefulExit) return false
        return await parentWizard.failure('No contract at that address. Probable black hole.')
      } else if (e.message.includes('Error parsing into type')) {
        if (gracefulExit) return false
        return await parentWizard.failure('That is a valid contract, but cosmic perturbations tell us it is not a cw20.')
      }
    }
    return daoInfo
  }

  const handleCW20Entry = async ({interaction}, ...extra) => {
    // We may modify this, but for now we're just dealing with text inputs
    if (parentWizard.currentStep.interactionType !== 'text') return;

    // Check to see if they pasted a DAODAO URL like this:
    // https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld
    let network = 'mainnet'
    let cw20Input, tokenInfo, cosmClient, daoInfo
    if (interaction.content.startsWith('https://daodao.zone')) {
      cosmClient = await CosmWasmClient.connect(MAINNET_RPC_ENDPOINT)
      daoInfo = await checkForDAODAODAO(cosmClient, interaction.content, true)
      if (daoInfo === false) {
        network = 'testnet'
        cosmClient = await CosmWasmClient.connect(TESTNET_RPC_ENDPOINT)
        daoInfo = await checkForDAODAODAO(cosmClient, interaction.content, false)
      }

      // If there isn't a governance token associated with this DAO, fail with message
      if (!daoInfo || !daoInfo.hasOwnProperty('gov_token')) {
        return await parentWizard.failure("We couldn't find any governance token associated with your DAO :/\nPerhaps destroyed in a supernova?")
      }
      cw20Input = daoInfo['gov_token']
      // Now that we have the cw20 token address and network, get the info we want
      tokenInfo = await checkForCW20(cosmClient, cw20Input, false)
    } else {
      // Check user's cw20 token for existence on mainnet then testnet
      cw20Input = interaction.content;
      cosmClient = await CosmWasmClient.connect(MAINNET_RPC_ENDPOINT)
      tokenInfo = await checkForCW20(cosmClient, cw20Input, true)
      if (tokenInfo === false) {
        // Nothing was found on mainnet, try testnet
        network = 'testnet'
        cosmClient = await CosmWasmClient.connect(TESTNET_RPC_ENDPOINT)
        tokenInfo = await checkForCW20(cosmClient, cw20Input, false)
      }
    }

    // If there were an error it would have returned a failure.
    // At this point we have the network and token info
    console.log('tokenInfo for user input', tokenInfo)

    parentWizard.state.cw20 = cw20Input
    parentWizard.state.network = network
    parentWizard.state.tokenSymbol = tokenInfo.symbol
    // Move to step 2
    parentWizard.currentStep = parentWizard.steps[1]
    parentWizard.currentStep.beginFn({ interaction: null })
  }

  let promptForCW20 = new MessageEmbed()
    .setColor('#FDC2A0')
    .setTitle('Enter your token address')
    .setDescription('Please write your cw20 token address in Discord chat…')
  // add options to that step
  step.addOptionStep('hasCW20', new WizardStep(
    parentWizard,
    'text',
    null,
    async({ interaction }, ...extra) => {
      let guild = await step.parentWizard.client.guilds.fetch(parentWizard.guildId)
      let channel = await guild.channels.fetch(parentWizard.channelId);
      await channel.send({
        embeds: [ promptForCW20 ]
      });
    },
    handleCW20Entry
  ))
  step.addOptionStep('needsCW20', new WizardStep(
    parentWizard,
    'text',
    null,
    async({interaction}, ...extra) => {
      let guild = await step.parentWizard.client.guilds.fetch(parentWizard.guildId)
      let channel = await guild.channels.fetch(parentWizard.channelId);
      await channel.send({
        embeds: [ new MessageEmbed()
          .setColor('#FDC2A0')
          .setTitle('Learning about cw20 tokens…')
          .setDescription('This info will help you understand your options.')
          .addFields([
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
        ])
          .setFooter({text: "🎗️ When you're finished creating your cw20 token, please type the address in this channel."})
        ]
      });
    },
    handleCW20Entry
  ))
  step.addOptionStep('daoDao', new WizardStep(
    parentWizard,
    'text',
    null,
    async({interaction}, ...extra) => {
      let guild = await step.parentWizard.client.guilds.fetch(parentWizard.guildId)
      let channel = await guild.channels.fetch(parentWizard.channelId);
      await channel.send({
        embeds: [ new MessageEmbed()
          .setColor('#FDC2A0')
          .setTitle('Check out DAODAO')
          .setURL('https://daodao.zone')
          .setDescription("If you haven't set up a DAO, visit the link above to create a DAO with a governance token.")
          .addFields([
          {
            name: '🧑‍🤝‍🧑', // a big space
            value: '☯',
            inline: false,
          },
          {
            name: "Paste your DAODAO URL and we'll take care of the rest!",
            value: "(For example, it'll look something like https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld)",
          }
        ])
        ]
      });
    },
    handleCW20Entry
  ))
  return step
}

function createStep2(userId, parentWizard) {
  let step = new WizardStep(
    parentWizard,
    'text',
    null,
    async({ interaction }, ...extra) => {
      const guild = await parentWizard.client.guilds.fetch(parentWizard.guildId)
      let channel = await guild.channels.fetch(parentWizard.channelId);
      await channel.send({
        embeds: [ new MessageEmbed()
          .setColor('#FDC2A0')
          .setTitle('How many tokens?')
          .setDescription('Please enter the number of tokens a user must have to get a special role.')
          .setFooter({text: 'Note: this role will be created automatically'}) ]
      });
    },
    async({ interaction }, ...extra) => {
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
      await rolesSet(parentWizard.guildId, roleToCreate, 'cw20', parentWizard.state.cw20, 'testnet', true, interaction.author.id, amountOfTokensNeeded)
      parentWizard.done(`You may now use the role ${roleToCreate} for token-gated channels.\n\nEnjoy, traveller!`)
    }
  )
  return step
}

module.exports = { WizardAddTokenRule }
