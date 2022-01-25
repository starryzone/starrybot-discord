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

module.exports = {
  WizardStep,
  Wizard,
  globalUserWizards
}
