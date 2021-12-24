const hre = require("hardhat");

const utils = require("./utils");

async function main() {
  const addresses = utils.getContractAddresses();

  const network = await hre.ethers.provider.getNetwork();

  const [, proxyDeployer] = await hre.ethers.getSigners();

  const AssetProxy = await hre.ethers.getContractFactory("AssetProxy", proxyDeployer);
  const proxy = await AssetProxy.deploy();
  await proxy.deployed();

  const ChildManager = await hre.ethers.getContractFactory("ChildManager");
  const childManager = await ChildManager.deploy();
  await childManager.deployed();

  const Erc20Operator = await hre.ethers.getContractFactory("contracts/child/ERC20Operator.sol:ERC20Operator");
  const erc20Operator = await Erc20Operator.deploy();
  await erc20Operator.deployed();

  addresses.child.AssetProxy = proxy.address;
  addresses.child.ChildManager = childManager.address;
  addresses.child.ERC20Operator = erc20Operator.address;
  utils.writeContractAddresses(addresses);

  await proxy.transferOwnership(childManager.address);

  await childManager.initialize(proxy.address, utils.getChildChainManagerAddress(network.chainId));
  const tokenType = await erc20Operator.TOKEN_TYPE();
  await childManager.registerOperator(tokenType, erc20Operator.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
