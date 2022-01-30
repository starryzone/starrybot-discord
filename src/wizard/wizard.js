// This is where we'll keep user's progress through the wizard "in memory"
// The key/values are:
//   key: guildId-userId
//   value: Wizard or class extension instantiation
const { MessageEmbed } = require("discord.js");
let globalUserWizards = new Map()

class WizardStep {
  parentWizard;
  respondToMessageId; // first step is null, the rest aren't
  optionSteps = {}; // non-sequential
  interactionType; // reaction, text, button
  /*
  beginFn takes an optional interaction and will generally
  send a message, kicking off a prompt
  */
  beginFn;
  /*
  resultFn takes interaction and returns:
  must change the Wizard's currentStep
  and should likely call the currentStep's beginFn
  if it's reached the end of the wizard, call done()
  */
  resultFn;

  constructor(parentWizard, interactionType, respondToMessageId, beginFn, resultFn) {
    this.parentWizard = parentWizard
    this.interactionType = interactionType
    this.respondToMessageId = respondToMessageId
    this.beginFn = beginFn
    this.resultFn = resultFn
  }

  addOptionStep(key, wizardStep) {
    this.optionSteps[key] = wizardStep
  }

  setMessageId(msgId) {
    this.respondToMessageId = msgId
  }
}

class Wizard {
  client;
  discordUserId; // There will also be a key for this, but we'll have it here as well
  channelId;
  guildId;
  steps = []; // sequential Wizard Step objects
  currentStep; // step object
  createdAt;
  state = {}; // save useful state info

  constructor() {
    this.createdAt = Date.now()
  }

  addStep(wizardStep) {
    this.steps.push(wizardStep)
  }

  async failure(failureMessage) {
    let guild = await this.client.guilds.fetch(this.guildId)
    let channel = await guild.channels.fetch(this.channelId);
    await channel.send({
      embeds: [ new MessageEmbed()
        .setColor('#be75a4')
        .setTitle('Error (star might be in retrograde)')
        .setDescription(failureMessage) ]
    });
    // Remove entry
    globalUserWizards.delete(`${this.guildId}-${this.discordUserId}`)
  }

  async done(doneMessage) {
    let guild = await this.client.guilds.fetch(this.guildId)
    let channel = await guild.channels.fetch(this.channelId);
    await channel.send({
      embeds: [ new MessageEmbed()
        .setColor('#7585FF')
        .setTitle('Finished! 🌟')
        .setDescription(doneMessage) ]
    });
    // Remove entry
    globalUserWizards.delete(`${this.guildId}-${this.discordUserId}`)
  }
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
