const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");

const getCW721TokenDetails = async (userInput) => {
  // Given the address of an NFT collection,
  // Fill out the following correctly
  return {
    network: null,
    tokenType: 'cw721',
    tokenSymbol: null,
    decimals: null, // keep null
  }
}

const getCW721TokenBalance = async (keplrAccount, tokenAddress, network) => {
  // Given the wallet address, NFT collection address,
  // and the network it's on, do the math for the following correctly

  // Return the # of NFTs this user has from this wallet
  return parseInt(1);
}

module.exports = {
  cw721: {
    name: 'CW721',
    // TO-DO: How can we tell if a token address is for an NFT?
    isTokenType: () => true,
    getTokenBalance: getCW721TokenBalance,
    getTokenDetails: getCW721TokenDetails,
  }
}
