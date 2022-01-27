const { WizardAddTokenRule } = require("../wizard/add-token-rule");

///
/// Add
///

async function starryCommandTokenAdd(interaction, client, globalUserWizards) {

	const userId = interaction.user.id

	// TODO: this is where we'll want to do a filter/map deal to remove all entries that have a {wizard}.createdAt that's > some amount, like 6 minutes

	let addTokenRuleWizard = new WizardAddTokenRule(interaction.guildId, interaction.channelId, userId, client)
	// Begin the wizard by calling the begin function on the first step
	const msg = await addTokenRuleWizard.currentStep.beginFn({interaction});

	// Now that we have the message object, we can set that, (sometimes) helping determine the user is reacting to the proper message
	addTokenRuleWizard.currentStep.setMessageId(msg.id)

	// Set the in-memory Map
	globalUserWizards.set(`${interaction.guildId}-${userId}`, addTokenRuleWizard)
}

module.exports = {
    starryCommandTokenAdd,
}
