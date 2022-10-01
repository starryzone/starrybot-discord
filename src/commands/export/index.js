module.exports = {
  starryCommandExport: {
    ephemeral: true,
    adminOnly: true,
    name: 'export',
    description: 'Export a CSV of the Cosmos Hub addresses engaging with your Discord',
    action: 'exportCsv',
  }
}
