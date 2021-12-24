/* eslint-disable no-unused-vars */
const hre = require("hardhat");

const utils = require("./utils");

const secrets = require("../secrets");

const maticjs = require("@maticnetwork/maticjs");
const Web3ClientPlugin = require('@maticnetwork/maticjs-ethers').Web3ClientPlugin;
const { ExitUtil, RootChain, use, Web3SideChainClient } = maticjs;

// install ethers plugin
use(Web3ClientPlugin)

const TX_HASH = "0xc6e0adf98bfe3e0081fbbe6b88da4363dab6803fef10e9ee900d685b9ee6978f";
const LOG_EVENT_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // erc20 transfer
const MY_LOG_EVENT_SIG = '0x579bef04d7a3da58f11e75bdd3f91f1f2aabee3c8f555d7d0bd4f28761bdc565'; // WithdrawTo(address)

async function main() {
    const addresses = utils.getContractAddresses();

    const [deployer] = await hre.ethers.getSigners();

    const exitUtil = await getExitUtil(deployer, secrets.mumbaiApiKey);

    const isCheckPointed = await exitUtil.isCheckPointed(TX_HASH);
    if (!isCheckPointed) {
        console.log("No Check Pointed");
        return;
    }

    const proof = await exitUtil.buildPayloadForExit(TX_HASH, LOG_EVENT_SIG, false);

    const myLogIndex = findMyLogIndex(getLogs(proof), MY_LOG_EVENT_SIG);

    const rootManager = await hre.ethers.getContractAt("RootManager", addresses.root.RootManager);

    const tx = await rootManager.exit(proof, myLogIndex, { gasLimit: 800000 });
    console.log(tx.hash);
}

async function getExitUtil(deployer, apiKey) {
    const childProvider = new hre.ethers.providers.JsonRpcProvider(`https://polygon-mumbai.g.alchemy.com/v2/${apiKey}`);

    const client = new Web3SideChainClient();
    // initiate client
    await client.init({
        // log: true,
        network: 'testnet',
        version: 'mumbai',
        parent: {
            provider: deployer.provider,
            defaultConfig: {
                from: deployer.address
            }
        },
        child: {
            provider: childProvider,
            defaultConfig: {
                from: deployer.address
            }
        }
    });

    // create root chain instance
    const rootChain = new RootChain(client, "0x2890bA17EfE978480615e330ecB65333b880928e");

    // create exitUtil Instance
    return new ExitUtil(client, rootChain);
}

function findMyLogIndex(logs, logEventSig) {
    let logIndex = logs.findIndex(log => log.topics[0].toLowerCase() === logEventSig.toLowerCase());
    if (logIndex < 0) {
        throw new Error("Log not found in receipt");
    }
    return logIndex;
}

function getLogs(proof) {
    const data = hre.ethers.utils.RLP.decode(proof);
    const receipt = hre.ethers.utils.RLP.decode(data[6]);
    return receipt[3].map(v => {
        return {
            address: v[0],
            topics: v[1],
            data: v[2],
        };
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
