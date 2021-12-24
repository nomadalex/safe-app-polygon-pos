const fs = require('fs')

module.exports = {
  getContractAddresses: () => {
    try {
      return JSON.parse(fs.readFileSync(`${process.cwd()}/contractAddresses.json`).toString())
    } catch (e) {
      return {
        root: {},
        child: {}
      }
    }
  },
  writeContractAddresses: (contractAddresses) => {
    fs.writeFileSync(
      `${process.cwd()}/contractAddresses.json`,
      JSON.stringify(contractAddresses, null, 2) // Indent 2 spaces
    )
  },
  getRootChainManagerAddress: (chainId) => {
    if (chainId === 1) {
        return "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77";
    }
    if (chainId === 5) {
        return "0xBbD7cBFA79faee899Eaf900F13C9065bF03B1A74";
    }
    return "0x0000000000000000000000000000000000000000";
  }
}
