
const getDAOAddressFromDAODAOUrl = daoDAOUrl => {
  const daoAddressRegex = /^https:\/\/(testnet\.)?daodao.zone\/dao\/(\w*)/;
  const regexMatches = daoAddressRegex.exec(daoDAOUrl);
  // [0] is the string itself, [1] is the (testnet\.) capture group, [2] is the (\w*) capture group
  return regexMatches[2];
}

module.exports = {
  getDAOAddressFromDAODAOUrl,
  
  daodao: {},
}
