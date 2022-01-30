const { createEmbed } = require("../utils/messages");
const { WizardStep } = require("./wizardStep");

// This is where we'll keep user's progress through the wizard "in memory"
// The key/values are:
//   key: guildId-userId
//   value: Wizard or class extension instantiation
let globalUserWizards = new Map()

class Wizard {
  channelId;
  client;
  createdAt;
  currentStep; // step object
  discordUserId; // There will also be a key for this, but we'll have it here as well
  guildId;
  state = {}; // save useful state info
  steps = []; // sequential Wizard Step objects

  /*
   * The Wizard Config now allows us to create new wizards more easily
   * by accepting a JSON-like object defining how we'd like the wizard
   * to behind.
   *
   * The config is currently expected to have the following shape:
   * {
   *    steps: [
   *      // For each step the wizard supports
   *      {
   *        interactionType: // reaction, text, button
   *        respondToMessageId: // if known - may also be set later
   *
   *        // One of the following - this is how the step starts
   *        beginFn: // the exact function that should be called for WizardStep.beginFn
   *        beginWithMessage: { // A message to send as the begin function
   *           type: 'interaction' | anything else
   *           embedArgs: // object containing props for createEmbed
   *        }
   *
   *        // One of the following - this determines how the step ends
   *        options: [ // options they can select from this message
   *          {
   *            optionName: // unique name for this step
   *            emoji: // discord emoji to react with
   *            embedArgs: // object containing props for createEmbed
   *            resultFn: // function to be called when option is selected
   *          }
   *        ]
   *        resultFn: // the exact function that should be called for WizardStep.resultFn
   *      }
   *    ]
   * }
   *
   */
  constructor(wizardConfig, guildId, channelId, userId, client) {
    this.discordUserId = userId
    this.channelId = channelId
    this.client = client
    this.createdAt = Date.now()
    this.guildId = guildId

    let step;
    wizardConfig.steps.forEach(stepConfig => {
      step = new WizardStep(
        this,
        stepConfig.interactionType,
        stepConfig.respondToMessageId,
        async({ interaction }, ...extra) => {
          const { beginFn, beginWithMessage } = stepConfig;
          let msg;
          // If a begin function is passed in, use it
          if (beginFn) {
            beginFn(this, { interaction }, ...extra);
          } else {
            // Otherwise, we can send an easy message instead
            const { embedArgs } = beginWithMessage;
            // First send the message representing this step.
            // This will be either a response to a specific interaction (i.e. a command)
            // or a general message in the channel the wizard is in
            if (beginWithMessage.type === 'interaction') {
              msg = await interaction.reply(
                {
                  embeds: [ createWizardStepEmbed(embedArgs) ],
                  fetchReply: true,
                }
              )
            } else {
              const guild = await this.client.guilds.fetch(guildId);
              let channel = await guild.channels.fetch(channelId);
              msg = await channel.send({
                embeds: [ createWizardStepEmbed(embedArgs) ]
              });
            }
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
          // If a results function is passed in, use it
          if (stepConfig.resultFn) {
            stepConfig.resultFn(this, { interaction }, ...extra);
          }

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
        stepConfig.options.forEach(({ optionName, embedArgs, resultFn }) => {
          step.addOptionStep(optionName, new WizardStep(
            this,
            'text',
            null,
            async({ interaction }, ...extra) => {
                let guild = await step.parentWizard.client.guilds.fetch(guildId)
                let channel = await guild.channels.fetch(channelId);
                await channel.send({
                    embeds: [ createWizardStepEmbed(embedArgs) ]
                });
            },
            ({ interaction }, ...extras) => resultFn(this, { interaction }, ...extras),
          ))
        })
      }

      this.steps.push(step);
    })

    // Initialize the wizard to the first step
    this.currentStep = this.steps[0];
  }

  async failure(failureMessage) {
    let guild = await this.client.guilds.fetch(this.guildId)
    let channel = await guild.channels.fetch(this.channelId);
    await channel.send({
      embeds: [
        createEmbed({
          color: '#be75a4',
          title: 'Error (star might be in retrograde)',
          description: failureMessage,
        })
      ]
    });
    // Remove entry
    globalUserWizards.delete(`${this.guildId}-${this.discordUserId}`)
  }

  async done(doneMessage) {
    let guild = await this.client.guilds.fetch(this.guildId)
    let channel = await guild.channels.fetch(this.channelId);
    await channel.send({
      embeds: [
        createEmbed({
          color: '#7585FF',
          title: 'Finished! 🌟',
          description: doneMessage,
        })
      ]
    });
    // Remove entry
    globalUserWizards.delete(`${this.guildId}-${this.discordUserId}`)
  }
}

// Making all wizard steps use the same color
function createWizardStepEmbed (args) {
  return createEmbed({
    color: '#FDC2A0',
    ...args
  })
}

// Respond to general interaction
const TIMEOUT_DURATION = 360000; // 6 minutes in milliseconds
async function checkInteractionWithWizard(interaction) {
	if (globalUserWizards.size === 0) return;
	const authorId = interaction.author.id;
	const wizardKey = `${interaction.guildId}-${authorId}`;
	// If it's a regular "DEFAULT" message from a user in the wizard on that step
	if (interaction.type === 'DEFAULT' && globalUserWizards.has(wizardKey)) {
		// Check if its expired and delete it if so
		const userWizard = globalUserWizards.get(wizardKey)
		if (Date.now() - userWizard.createdAt > TIMEOUT_DURATION) {
			globalUserWizards.delete(wizardKey)
			console.log("Deleted a user's wizard as it took them too long to respond.")
			return;
		}
		await userWizard.currentStep.resultFn({interaction})
	}
}

// Respond to emoji reaction
async function checkReactionWithWizard(reaction) {
	if (globalUserWizards.size === 0) return;

	// See if the "reactor" has a wizard going
	// Note: checking for interaction key as some emoji reactions didn't seem to have this
	// Also, this check exists because an emoji to a reply-message will have a null interaction value for some reason
	if (!reaction.message.hasOwnProperty('interaction') || reaction.message.interaction === null) return;
	const reactorUserId = reaction.message.interaction.user.id;

	const globalUserWizardKey = `${reaction.message.guildId}-${reactorUserId}`;
	if (!globalUserWizards.has(globalUserWizardKey)) return;

	const emojiName = reaction._emoji.name;
	let userCurrentStep = globalUserWizards.get(globalUserWizardKey).currentStep;
	userCurrentStep.resultFn({
		guildId: reaction.message.guildId,
		channelId: reaction.message.channelId
	}, emojiName)
}

module.exports = {
  checkInteractionWithWizard,
  checkReactionWithWizard,

  WizardStep,
  Wizard,
  globalUserWizards
}
