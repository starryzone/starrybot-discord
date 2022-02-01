const { starryCommandFarewell } = require('./farewell');
const { starryCommandJoin } = require('./join');
const { starryCommandRoleList } = require('./roleList');
const { starryCommandTokenAdd } = require('./tokenAdd');
// TODO: we'll add this in later
// const { starryCommandTokenEdit } = require('./tokenEdit');
const { starryCommandTokenRemove } = require('./tokenRemove');

const starryCommands = [
    {
        name: 'token-rule',
        description: "cw20 or cw721 token and Discord role",
        options: [
            {
                name: 'add',
                description: 'Add a new token rule',
                handler: starryCommandTokenAdd
            },
            // {
            //     name: 'edit',
            //     description: 'Edit token rule',
            //     handler: starryCommandTokenEdit,
            // },
            {
                name: 'remove',
                description: 'Remove token rule',
                handler: starryCommandTokenRemove,
            }
        ]
    },
    {
        name: 'join',
        description: "Get link to verify your account with Keplr",
        handler: starryCommandJoin,
    },
    {
        name: 'role-list',
        description: 'See all roles available for this guild',
        handler: starryCommandRoleList,
    },
    {
        name: 'farewell',
        description: "Kick starrybot itself from your guild",
        handler: starryCommandFarewell,
    }
]

module.exports = {
    starryCommands,
}
