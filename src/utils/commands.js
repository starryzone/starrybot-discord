const {
	starryCommandFarewell,
	starryCommandJoin,
	starryCommandTokenAdd,
	starryCommandTokenEdit,
	starryCommandTokenRemove
} = require('../commands');

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

module.exports = {
    getCommandHandler,
}
