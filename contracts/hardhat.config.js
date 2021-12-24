require("@nomiclabs/hardhat-waffle");

const secrets = require("./secrets");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    const balance = await account.getBalance();
    console.log(account.address, hre.ethers.utils.formatEther(balance));
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    goerli: {
        url: `https://eth-goerli.alchemyapi.io/v2/${secrets.goerliApiKey}`,
        accounts: [secrets.normalDeployerPrivKey, secrets.proxyDeployerPrivKey]
    },
    mumbai: {
        url: `https://polygon-mumbai.g.alchemy.com/v2/${secrets.mumbaiApiKey}`,
        accounts: [secrets.normalDeployerPrivKey, secrets.proxyDeployerPrivKey]
    }
  }
};
