const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { getConnectionFromToken } = require('./networks')

// Check to see if they pasted a DAODAO URL like this:
// https://daodao.zone/dao/juno129spsp500mjpx7eut9p08s0jla9wmsen2g8nnjk3wmvwgc83srqq85awld
const isDaoDaoAddress = daodaoUrl => {
  const daodaoRegex = /^https:\/\/(testnet\.|legacy\.)?daodao.zone/;
  return daodaoUrl.match(daodaoRegex);
}

const getDAOAddressFromDAODAOUrl = daoDAOUrl => {
  const daoAddressRegex = /^https:\/\/(testnet\.|legacy\.)?daodao.zone\/dao\/(\w*)/;
  const regexMatches = daoAddressRegex.exec(daoDAOUrl);
  // [0] is the string itself, [1] is the (testnet\.|legacy\.) capture group, [2] is the (\w*) capture group
  return regexMatches[2];
}

const getCosmClientForDao = async (daoAddress, network) => {
  const rpcEndpoint = getConnectionFromToken(daoAddress, 'rpc', network)
  return CosmWasmClient.connect(rpcEndpoint)
}

const getCW20InputFromDaoDaoDao = async (daodaoUrl) => {
  if (!isDaoDaoAddress(daodaoUrl)) return;

  const network = daodaoUrl.includes('testnet') ? 'testnet' : 'mainnet';

  // Let's determine the RPC to connect to
  // based on the dao address
  const daoAddress = getDAOAddressFromDAODAOUrl(daodaoUrl)
  const cosmClient = await getCosmClientForDao(daoAddress, network);
  let daoInfo;
  try {
    const votingModuleAddress = await cosmClient.queryContractSmart(daoAddress, {
      voting_module: { },
    });
    if (!votingModuleAddress) {
      throw "We couldn't find any governance token associated with your DAO :/\nPerhaps destroyed in a supernova?"
    } else {
      return {
        govToken: await cosmClient.queryContractSmart(votingModuleAddress, {
          token_contract: { },
        }),
        stakingContract: await cosmClient.queryContractSmart(votingModuleAddress, {
          staking_contract: { },
        })
      }
    }
  } catch (err) {
    // This endpoint works for legacy DAOs, which technically can still be upgraded, so
    // continue to support for now.
    daoInfo = await cosmClient.queryContractSmart(daoAddress, {
      get_config: { },
    })
    // If there isn't a governance token associated with this DAO, fail with message
    if (!daoInfo || !daoInfo.hasOwnProperty('gov_token')) {
      throw "We couldn't find any governance token associated with your DAO :/\nPerhaps destroyed in a supernova?";
    } else {
      return {
        govToken: daoInfo['gov_token'],
        stakingContract: daoInfo['staking_contract']
      };
    }
  }
}

// Future thought - this currently is implemented by querying the
// proposal address for the most recent proposals, slicing the array
// by the # of proposals to compare against (if desired), and then
// fetching the voting information for the resulting list.
// This is where something like an indexer would be much better.
const getProposalVotesFromAddress = async (proposalAddress, network, limit) => {
  const cosmClient = await getCosmClientForDao(proposalAddress, network);
  const data = await cosmClient.queryContractSmart(proposalAddress, {
    reverse_proposals: { },
  });

  const proposals = limit ?
    data.proposals.slice(0, limit) :
    data.proposals;
  const proposalVotes = await Promise.all(
    proposals.map(proposal => cosmClient.queryContractSmart(proposalAddress, {
      list_votes: { proposal_id: proposal.id }
    }))
  )
  return proposals.map((proposal, index) => ({
    proposal,
    votes: proposalVotes[index].votes
  }));
}

module.exports = {
  isDaoDaoAddress,
  getCosmClientForDao,
  getCW20InputFromDaoDaoDao,
  getDAOAddressFromDAODAOUrl,
  getProposalVotesFromAddress,
}
