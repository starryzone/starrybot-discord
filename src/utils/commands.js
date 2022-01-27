const { starryCommands } = require('../commands');

// Only need to format the blob once for Discord's consumption
const starryGuildCommands = getApplicationGuildCommands();

// Only need to make our convenient map once
const starryCommandHandlers = getStarryHandlers();

///
/// This generates the correctly shaped blob for registering our commands with discord via rest
///
/// Note: discordjs doesn't have abstractions for subcommand groups and subcommands like I expected. Used logic from:
/// https://discord.com/developers/docs/interactions/application-commands#example-walkthrough
///
function getApplicationGuildCommands() {
    return {
        name: 'starry',
        description: 'Use StarryBot (starrybot.xyz)',
        options: starryCommands.map(starryCommand => {
            const mappedCommand = {
                name: starryCommand.name,
                description: starryCommand.description
            }
            if (starryCommand.options) {
                mappedCommand.type = 2; // SUB_COMMAND_GROUP
                mappedCommand.options = starryCommand.options
                    .map(option => ({
                        name: option.name,
                        description: option.description,
                        type: 1, // SUB_COMMAND
                    }));
            } else {
                mappedCommand.type = 1; // SUB_COMMAND
            }
            return mappedCommand;
        })
    };
}

function getStarryHandlers () {
    const starryCommandHandlers = {};

    starryCommands.forEach(command => {
        if (command.options) {
            command.options.forEach(option => {
                starryCommandHandlers[`${command.name} ${option.name}`] = option.handler;
            });
        } else {
            starryCommandHandlers[command.name] = command.handler;
        }
    })

    return starryCommandHandlers;
}

function getCommandHandler(path) {
    return starryCommandHandlers[path];
}

function checkIfCommandsEnabled(enabledGuildCommands) {
    // Ensure (double-check) we have the Slash Command registered,
    //   then publicly tell everyone they can use it
    for (let enabledGuildCommand of enabledGuildCommands) {
        if (enabledGuildCommand.name === starryGuildCommands.name) {
            return true;
        }
    }

    return false;
}

function checkIfInteractionIsStarry(interaction) {
    return interaction.commandName === starryGuildCommands.name;
}

module.exports = {
    checkIfCommandsEnabled,
    checkIfInteractionIsStarry,
    getCommandHandler,

    starryGuildCommands,
}
