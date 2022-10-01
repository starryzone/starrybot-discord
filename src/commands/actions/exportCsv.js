const fs = require('fs')
const { Bech32 } = require('@cosmjs/encoding')

const { networkPrefixes } = require('../../astrolabe/networks');

const exportCsv = async (state, { db }) => {
  const guildId = state.interaction.guildId;

  // Create CSV in exports directory (overwrite if exists)
  const guildObj = state.guild
  console.log(`${guildObj.id} — ${guildObj.name}, owner: ${guildObj.ownerId}`)
  let asciiName = guildObj.name.replace(/[^\x00-\x7F]/g, '')
  asciiName = asciiName.replace(/\//g, '')
  let stream
  let attachmentPaths = []
  for (const network of networkPrefixes) {
    const filePath = `exports/${guildObj.id}-${asciiName}-${network}.csv`
    stream = fs.createWriteStream(filePath, {flags: 'w'})
    stream.write('address,amount\n')

    const CosmosAddresses = await db.cosmosAddressesForGuild(guildId)
    for (const { cosmos_address: cosmosAddress } of CosmosAddresses) {
      const decodedAccount = Bech32.decode(cosmosAddress).data
      const encodedAccount = Bech32.encode(network, decodedAccount)
      stream.write(`${encodedAccount},1000000\n`)
    }
    stream.close()
    attachmentPaths.push({attachment: filePath})
  }

  return {
    ephemeral: true,
    done: {
      title: 'CSV Export',
      description: 'This CSV contains the addresses of Cosmos users who have joined on your Discord server.',
      attachments: attachmentPaths
    }
  }
};


module.exports = { exportCsv };
