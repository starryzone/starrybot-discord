const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromToken } = require('./networks')

// Check to see if they pasted a Stargaze Launchpad URL like this:
// https://app.stargaze.zone/launchpad/stars1m95chyen8tqrawmjhxrewcwscg5vj8pkxzxeaw8em7fnjwth8rusaftwk4
const isStargazeLaunchpadAddress = stargazeUrl => {
  const stargazeLaunchpadRegex = /^https:\/\/app.stargaze.zone\/launchpad\/stars\w*/;
  return stargazeUrl.match(stargazeLaunchpadRegex);
}

const getCW721FromStargazeLaunchpadUrl = async stargazeUrl => {
  const stargazeLaunchpadRegex = /^https:\/\/app.stargaze.zone\/launchpad\/(stars\w*)/;
  const regexMatches = stargazeLaunchpadRegex.exec(stargazeUrl);
  // [0] is the string itself, [1] is the (\w*) capture group
  const otherNftContract = regexMatches[1];

  let cosmClient;
  // No network defined, check for existence on mainnet then testnet
  let network = 'mainnet';
  let config, rpcEndpoint;
  try {
    rpcEndpoint = getConnectionFromToken(otherNftContract, 'rpc', network)
    cosmClient = await CosmWasmClient.connect(rpcEndpoint);
    config = await cosmClient.queryContractSmart(otherNftContract, {
      config: { },
    });
  } catch {
    // Nothing was found on mainnet but this could still be on testnet,
    // so swallow the error and try testnet instead
    network = 'testnet'
    rpcEndpoint = getConnectionFromToken(otherNftContract, 'rpc', network)
    cosmClient = await CosmWasmClient.connect(rpcEndpoint);
    config = await cosmClient.queryContractSmart(otherNftContract, {
      config: { },
    });
  }
  return config.sg721_address;
}

const getCW721FromStargazeUrl = async stargazeUrl => {
  if (!isStargazeLaunchpadAddress(stargazeUrl)) return;

  const NFTAddress = await getCW721FromStargazeLaunchpadUrl(stargazeUrl)

  return NFTAddress;
}

module.exports = {
  isStargazeLaunchpadAddress,
  getCW721FromStargazeUrl,
}
