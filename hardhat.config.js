const ALCHEMY_API_KEY = "6I3s85vuQUb6y6_aMpjihWp5O25toZVU";

const GOERLI_PRIVATE_KEY = "9780205714afb00178664155cb66c08f9b8a0eb2e483c6398cdf028f5d57f001";


 const fs = require('fs');
require("@nomiclabs/hardhat-waffle");

const privateKey = fs.readFileSync('.secret').toString().trim();

module.exports = {
  solidity: "0.8.4",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY]
    }
  }
};