const { continueCommandChain } = require("../commands");

///
/// A user may have sent an emoji - we are very interested in these
///

async function messageReactionAdd(reaction, user) {
	if (user.bot) return; // don't care about bot's emoji reactions
	await continueCommandChain(reaction);

	// When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			const fetched = await reaction.fetch();
			console.log(fetched);
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	// The reaction is now also fully available and the properties will be reflected accurately:
	console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
}

module.exports = {
    messageReactionAdd,
}
