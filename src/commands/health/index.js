const { rolesGet } = require("../../db");
const { checkRPCStatus, checkLCDStatus, networkInfo } = require("../../astrolabe/networks");

async function checkRPC(networkName, networkUrl) {
  const prefix = `${networkName} RPC status:`
  try {
    await checkRPCStatus(networkUrl);
    return `${prefix} 🟢`;
  } catch (e) {
    console.warn(`Could not connect to RPC at ${networkUrl} for ${networkName}`, e);
    return `${prefix} 🔴`;
  }
}

async function checkLCD(networkName, lcdUrl) {
  const prefix = `${networkName} LCD status:`
  try {
    await checkLCDStatus(lcdUrl);
    return `${prefix} 🟢`;
  } catch (e) {
    console.warn(`Could not connect to LCD at ${lcdUrl} for ${networkName}`, e);
    return `${prefix} 🔴`;
  }
}

async function checkAllNetworks() {
  // Loop through all of our networks
  let networkPromises = [];
  Object.keys(networkInfo).forEach(networkName => {
    const network = networkInfo[networkName];
    if (network.rpc.mainnet) {
      networkPromises.push(checkRPC(networkName + ' RPC (mainnet)', network.rpc.mainnet));
    }
    if (network.rpc.testnet) {
      networkPromises.push(checkRPC(networkName + ' RPC (testnet)', network.rpc.testnet));
    }
    if (network.lcd.mainnet) {
      networkPromises.push(checkLCD(networkName + ' LCD (mainnet)', network.lcd.mainnet));
    }
    if (network.lcd.testnet) {
      networkPromises.push(checkLCD(networkName + ' LCD (testnet)', network.lcd.testnet));
    }
  });
  return await Promise.all(networkPromises);
};

async function checkAllPermissions(guild) {
  const allDBRoles = await rolesGet(guild.id);
  const allDiscordRoles = await guild.roles.fetch();

  if (allDBRoles.length === 0) {
    return [`No token rules yet!`];
  }

  const permissionPromises = allDBRoles.map(async role => {
    const prefix = `${role.give_role} status:`;
    const existingRole = allDiscordRoles.find(discordRole => discordRole.name === role.give_role);

    // We have a record of a role they may have deleted.
    // Just add it and let them know.
    if (!existingRole) {
      await guild.roles.create({name: role.give_role, position: 0});
      return `${prefix} 🟢 (role was missing, but now fixed)`;
    }

    // Try to "edit" the role with the same name - if we fail,
    // it means we don't have the permission to give it to someone else either
    try {
      await guild.roles.edit(existingRole, { name: role.give_role})
      return `${prefix} 🟢`;
    } catch (e) {
      if (e?.message && e.message.includes('Missing Permissions')) {
        return `${prefix} 🔴 (permissions are not high enough)`;
      } else {
        return `${prefix} 🔴`;
      }
    }
  });
  return await Promise.all(permissionPromises);
};

module.exports = {
  starryCommandHealth: {
    adminOnly: true,
    name: 'health',
    description: 'Run diagnostics for starrybot',
    config: async (req, res, ctx, next) => {
      const { interaction } = req;
      const { guild } = interaction;
      const networkResults = await checkAllNetworks();
      const permissionsResults = await checkAllPermissions(guild);

      return {
        embeds: [
          {
            color: '#7585FF',
            title: 'Diagnostics results 🌟',
            description: 'This info describes what starrybot needs to work correctly',
            fields: [
              // Shouldn't be possible for these two arrays to be empty, but
              // the message won't send at all if this value is undefined
              {
                name: 'Network statuses',
                value: networkResults.join('\n') || '',
              },
              {
                name: 'Role permissions',
                value: permissionsResults.join('\n') || '',
              },
            ],
            footer: `If there are any 🔴 above, please note that starrybot may not work as expected!`,
          }
        ],
      }
    }
  }
}
