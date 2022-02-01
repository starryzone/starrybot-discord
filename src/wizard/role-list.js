const { rolesGet, rolesDelete, rolesUpdate } = require("../db");
const { createButton, createEmbed, createMessage } = require("../utils/messages");

function validateRoleInput(input, state) {
  if (!state.roles.some(role => role.give_role === input)){
    return false;
  }

  return true;
}

function navigateToStep(parentWizard, stepNumber, interaction) {
  parentWizard.currentStep = parentWizard.steps[stepNumber - 1];
  parentWizard.currentStep.beginFn({ interaction })
}

const RoleListWizardConfig = {
  steps: [
    // List all the tokens for this guild
    {
      interactionType: 'reaction',
      beginFn: async (parentWizard, { interaction }) => {
        let roles = await rolesGet(interaction.guildId);
        // Don't make us fetch it over and over again..
        parentWizard.state.roles = roles;
        const rolesList = roles.map(role => {
          const roleName = role.give_role;
          const roleAmt = role.has_minimum_of;
          return `-${roleName} (min: ${roleAmt})\n`;
        }).join('');
        const commandList = '🛂 Rename a role\n✏️Edit number of tokens\n🗑 Delete a role';

        const msg = await interaction.reply({
          embeds: [
            createEmbed({
              title: `StarryBot found ${roles.length} roles for this guild`,
              description: `${rolesList}\n${commandList}`,
            })
          ],
          // Required for emoji reactions
          fetchReply: true
        });

        // beginFn must return the message object for the option steps
        // to react to correctly
        return msg;
      },
      // Things they can do about this
      options: [
        {
          optionName: 'renameRole',
          emoji: '🛂',
          embedArgs: {
            title: 'Which role do you want to rename?',
          },
          resultFn: async (parentWizard, { interaction }) => {
            const input = interaction.content;
            const isValid = validateRoleInput(input, parentWizard.state);

            if (!isValid) {
              return await parentWizard.failure('Need a valid role to rename');
            }
            parentWizard.state.verb = 'rename';
            parentWizard.state.selectedRoleName = input;
            const msg = await interaction.reply('What should be the new role name?');
            navigateToStep(parentWizard, 2, msg);
          }
        },
        {
          optionName: 'modifyRole',
          emoji: '✏️',
          embedArgs: {
            title: 'Which role do you want to edit?',
          },
          resultFn: async(parentWizard, { interaction }) => {
            const input = interaction.content;
            const isValid = validateRoleInput(input, parentWizard.state);

            if (!isValid) {
              return await parentWizard.failure('Need a valid role to edit');
            }
            const role = parentWizard.state.roles.find(role => role.give_role === input);
            parentWizard.state.selectedRoleName = input;
            parentWizard.state.verb = 'edit';
            const msg = await interaction.reply(`How many tokens minimum should a user have to receive this role? (Currently ${role.has_minimum_of})`)
            navigateToStep(parentWizard, 2, msg);
          },

        },
        {
          optionName: 'deleteRole',
          emoji: '🗑',
          embedArgs: {
            title: 'Which role do you want to delete?',
          },
          resultFn: async (parentWizard, { interaction }) => {
            const input = interaction.content;
            const isValid = validateRoleInput(input, parentWizard.state);
            if (!isValid) {
              return await parentWizard.failure('Need a valid role to delete');
            }
            parentWizard.state.selectedRoleName = input;
            parentWizard.state.verb = 'delete';
            const button = createButton({ label: `Yes, I'm sure`, user: parentWizard.client.user});
            const message = createMessage({
              content: 'Are you sure you want to delete ' + input + '?',
              components: [button],
            });
            const msg = await interaction.reply(message);
            navigateToStep(parentWizard, 2, msg);
          }
        }
      ]
    },
    {
      interactionType: 'text',
      resultFn: async (parentWizard, { interaction }, ...extras) => {
        const selectedRoleName = parentWizard.state.selectedRoleName;
        const role = parentWizard.state.roles.find(role => role.give_role === selectedRoleName);
        const verb = parentWizard.state.verb;
        try {
          switch (verb){
            case ('rename'):
              const newName = interaction.content;
              // Rename in our DB
              await rolesUpdate(
                parentWizard.guildId,
                selectedRoleName,
                { ...role, give_role: newName }
              )
              // Rename in Discord too
              // const guild = 
              // await guild.roles.create({name: role.name, position: 0})

              parentWizard.done(`Your role ${selectedRoleName} has been successfully updated to ${newName}.\n\nEnjoy, traveller!`)
              break;
            case ('edit'):
              const amountOfTokensNeeded = interaction.content;
              // TO-DO: This should fail for all the same reasons as in add-token-rule,
              // so this is copy-pasted for now.
              if (!Number.isInteger(parseInt(amountOfTokensNeeded)) || amountOfTokensNeeded <= 0 ) {
                // Invalid reply
                return await parentWizard.failure('Need a positive number of tokens.')
              }

              // Update the role to have the new amount instead
              await rolesUpdate(
                parentWizard.guildId,
                selectedRoleName,
                { ...role, has_minimum_of: amountOfTokensNeeded }
              )
              parentWizard.done(`Your role ${selectedRoleName} has been successfully updated now require ${amountOfTokensNeeded.toString()} tokens.\n\nEnjoy, traveller!`)
              break;
            case('delete'):
                await rolesDelete(parentWizard.guildId, selectedRoleName);
                parentWizard.done(`Your role ${selectedRoleName} has been successfully deleted.\n\nEnjoy, traveller!`)
              break;
          }
        } catch (e) {
          console.warn("failed to complete the step: ", e);
          return await parentWizard.failure(`Something went wrong... please try again.`);
        }
        return;
      }
    }
  ]
}

module.exports = {
  RoleListWizardConfig,
}
