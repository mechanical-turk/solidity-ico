import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { HardhatNetworkAccountsUserConfig } from "hardhat/types";
import { ethers } from "ethers";

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/4071901d379a452fa530d67a8ebc4a03",
    },
    hardhat: {
      accounts: (() => {
        // we need more than just 20 accounts, so we generate them
        const accounts: HardhatNetworkAccountsUserConfig = [];
        // TODO: why are there only 40 accounts if i'm asking for
        for (let i = 0; i < 50; i++) {
          const wallet = ethers.Wallet.createRandom();
          accounts.push({
            balance: ethers.utils.parseEther("1000000000").toString(),
            privateKey: wallet.privateKey,
            address: wallet.address,
          } as any);
          // console.log(accounts[i]);
        }
        return accounts;
      })(),
      // chainId: 1337,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
