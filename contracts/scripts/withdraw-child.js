const hre = require("hardhat");

const utils = require("./utils");

const TOKEN_TYPE = "0x8ae85d849167ff996c04040c44924fd364217285e4cad818292c7ac37c0a345b"; // erc20
const TOKEN_ADDRESS = "0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa"; // weth
const TO_USER = "0x8E5144a3f483d5d57526C093A019ee1191702865";

async function main() {
  const addresses = utils.getContractAddresses();

  const token = await hre.ethers.getContractAt("IERC20", TOKEN_ADDRESS);
  const childManager = await hre.ethers.getContractAt("ChildManager", addresses.child.ChildManager);

  const amount = hre.ethers.utils.parseUnits("0.1");
  await token.approve(addresses.child.AssetProxy, amount);
  const withdrawData = hre.ethers.utils.defaultAbiCoder.encode(["uint256"], [amount]);
  const tx = await childManager.withdrawTo(TOKEN_TYPE, TOKEN_ADDRESS, TO_USER, withdrawData, { gasLimit: 300000 });
  console.log(tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
