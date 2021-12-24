const hre = require("hardhat");

const utils = require("./utils");

async function main() {
  const addresses = utils.getContractAddresses();

  const network = await hre.ethers.provider.getNetwork();

  const [, proxyDeployer] = await hre.ethers.getSigners();

  const AssetProxy = await hre.ethers.getContractFactory("AssetProxy", proxyDeployer);
  const proxy = await AssetProxy.deploy();
  await proxy.deployed();

  const RootManager = await hre.ethers.getContractFactory("RootManager");
  const rootManager = await RootManager.deploy();
  await rootManager.deployed();

  const EtherOperator = await hre.ethers.getContractFactory("EtherOperator");
  const etherOperator = await EtherOperator.deploy();
  await etherOperator.deployed();

  const Erc20Operator = await hre.ethers.getContractFactory("contracts/root/ERC20Operator.sol:ERC20Operator");
  const erc20Operator = await Erc20Operator.deploy();
  await erc20Operator.deployed();

  addresses.root.AssetProxy = proxy.address;
  addresses.root.RootManager = rootManager.address;
  addresses.root.EtherOperator = etherOperator.address;
  addresses.root.ERC20Operator = erc20Operator.address;
  utils.writeContractAddresses(addresses);

  await proxy.transferOwnership(rootManager.address);

  await rootManager.initialize(proxy.address, addresses.child.ChildManager, utils.getRootChainManagerAddress(network.chainId));
  const etherTokenType = await etherOperator.TOKEN_TYPE();
  await rootManager.registerOperator(etherTokenType, etherOperator.address);
  const erc20TokenType = await erc20Operator.TOKEN_TYPE();
  await rootManager.registerOperator(erc20TokenType, erc20Operator.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
