const { PermissionsBitField } = require('discord.js');

async function memberHasRole(member, role) {
  if (role === 'admin') {
    return memberHasPermissions(member, PermissionsBitField.Flags.Administrator);
  } else {
    return await member.roles.has(role);
  }
}

async function memberHasPermissions(member, permission) {
  return await member.permissions.has(permission);
}


module.exports = {
  memberHasPermissions,
  memberHasRole,
}
