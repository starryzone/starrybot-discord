const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const TESTNET_RPC_ENDPOINT = process.env.TESTNET_RPC_ENDPOINT || 'https://rpc.uni.juno.deuslabs.fi/'
const MAINNET_RPC_ENDPOINT = process.env.MAINNET_RPC_ENDPOINT || 'https://rpc-juno.itastakers.com/'

const { Wizard, WizardStep } = require("./wizard.js")
const { createStep2 } = require("./add-token-rule/steps/step2");
const { checkForCW20, checkForDAODAODAO } = require("../token");
const { createEmbed } = require("../utils/messages");

function createWizardEmbed (args) {
  return createEmbed({
    color: '#FDC2A0',
    ...args
  })
}

const wizardSteps = [
  {
    interactionType: 'reaction',
    beginWith: {
      type: 'interaction',
      embedArgs: {
        title: 'Tell us about your token',
        description: '🌠 Choose a token\n✨ I need to make a token\n☯️ I want (or have) a DAO with a token',
      }
    },
    options: [
      {
        optionName: 'hasCW20',
        emoji: '🌠',
        embedArgs: {
          title: 'Enter your token address',
          description: 'Please write your cw20 token address in Discord chat…',
        }
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
          footer: "🎗️ When you're finished creating your cw20 token, please type the address in this channel."
        }
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
        }
      }
    ]
  }
]

class WizardAddTokenRule extends Wizard {
  constructor(guildId, channelId, userId, client) {
    super();

    let step;
    wizardSteps.forEach(stepConfig => {
      step = new WizardStep(
        this,
        stepConfig.interactionType,
        stepConfig.respondToMessageId,
        async({ interaction }, ...extra) => {
          const { beginWith } = stepConfig;
          console.log(beginWith);
          const { embedArgs } = beginWith;
          let msg;
          // First send the message representing this step.
          // This will be either a response to a specific interaction (i.e. a command)
          // or a general message in the channel the wizard is in
          if (beginWith.type === 'interaction') {
            msg = await interaction.reply(
              {
                embeds: [ createWizardEmbed(embedArgs) ],
                fetchReply: true,
              }
            )
          } else {
            const guild = await this.client.guilds.fetch(guildId);
            let channel = await guild.channels.fetch(channelId);
            msg = await channel.send({
              embeds: [ createWizardEmbed(embedArgs) ]
            });
          }

          // If there are options, also react to our own message with the
          // emoji corresponding with each option for convenience
          if (stepConfig.options) {
            try {
              await Promise.all(stepConfig.options.map(option => msg.react(option.emoji)));
            } catch (error) {
              console.error('One of the emojis failed to react:', error);
            }
          }

          return msg;
        },
        async({ interaction }, ...extra) => {
          // If this step had options to choose from, handle the selection
          if (stepConfig.options) {
            if (extra.length === 0) {
              console.error('Expected an emojiName field in extra args');
              return;
            }

            const emojiName = extra[0];
            const selectedOption = stepConfig.options.find(option => option.emoji === emojiName);

            if (selectedOption) {
              this.currentStep = this.steps[0]['optionSteps'][selectedOption.optionName]
              this.currentStep.beginFn({ interaction: null })
            }
            else {
              console.warn('User did not pick an applicable emoji')
            }
          }
        }
      );

      if (stepConfig.options) {
        stepConfig.options.forEach(({ optionName, embedArgs }) => {
          step.addOptionStep(optionName, new WizardStep(
            this,
            'text',
            null,
            async({ interaction }, ...extra) => {
                let guild = await step.parentWizard.client.guilds.fetch(guildId)
                let channel = await guild.channels.fetch(channelId);
                await channel.send({
                    embeds: [ createWizardEmbed(embedArgs) ]
                });
            },
            ({ interaction }, ...extras) => handleCW20Entry(this, { interaction }, ...extras),
          ))
        })
      }

      this.addStep(step)
    })

    // Add first step (getting the cw20 address)
    // let step = createStep1(userId, this)
    // this.addStep(step)
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

const handleCW20Entry = async (parentWizard, {interaction}, ...extra) => {
  // We may modify this, but for now we're just dealing with text inputs
  if (parentWizard.currentStep.interactionType !== 'text') return;

  // Check to see if they pasted a DAODAO URL like this:
  // https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld
  let network = 'mainnet'
  let cw20Input, tokenInfo, cosmClient, daoInfo
  try {
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
        throw "We couldn't find any governance token associated with your DAO :/\nPerhaps destroyed in a supernova?";
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
  } catch (e) {
    return await parentWizard.failure(e);
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

module.exports = { WizardAddTokenRule }
