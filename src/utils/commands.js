const {
	starryCommandFarewell,
	starryCommandJoin,
	starryCommandTokenAdd,
	starryCommandTokenEdit,
	starryCommandTokenRemove
} = require('../commands');

const starryCommands = {
	"name": "starry",
	"description": "Use StarryBot (starrybot.xyz)",
	"options": [
		{
			"name": "token-rule",
			"description": "cw20 or cw721 token and Discord role",
			"type": 2, // SUB_COMMAND_GROUP
			"options": [
				{
					"name": "add",
					"description": "Add a new token rule",
					"type": 1 // SUB_COMMAND
				},
				{
					"name": "edit",
					"description": "Edit token rule",
					"type": 1
				},
				{
					"name": "remove",
					"description": "Remove token rule",
					"type": 1
				}
			]
		},
		{
			"name": "join",
			"description": "Get link to verify your account with Keplr",
			"type": 1,
		},
		{
			"name": "farewell",
			"description": "Kick starrybot itself from your guild",
			"type": 1,
		}
	]
}


///
/// Command lookup
/// The command handlers for the above commands
/// (Kept separate from starryCommands for now because the blob above is already formatted for discords consumption)
///

const starryCommandHandlers = {
	"join": starryCommandJoin,
	"farewell": starryCommandFarewell,
	"token-rule add": starryCommandTokenAdd,
	"token-rule edit": starryCommandTokenEdit,
	"token-rule remove": starryCommandTokenRemove
}

function getCommandHandler(path) {
    return starryCommandHandlers[path];
}

function checkIfCommandsEnabled(enabledGuildCommands) {
    // Ensure (double-check) we have the Slash Command registered,
    //   then publicly tell everyone they can use it
    for (let enabledGuildCommand of enabledGuildCommands) {
        if (enabledGuildCommand.name === starryCommands.name) {
            return true;
        }
    }

    return false;
}

function checkIfInteractionIsStarry(interaction) {
    return interaction.commandName === starryCommands.name;
}

module.exports = {
    checkIfCommandsEnabled,
    checkIfInteractionIsStarry,
    getCommandHandler,
    starryCommands,
}
