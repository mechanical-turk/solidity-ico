import { ethers } from "hardhat";

import dotenv from "dotenv";

dotenv.config();

async function main() {
  const [alice] = await ethers.getSigners();

  const contractAddress = process.env.CONTRACT_ADDRESS as string;
  const togglingTo = process.env.IS_TAXED === "true";

  const spaceCoin = await ethers.getContractAt("SpaceCoin", contractAddress);
  await spaceCoin.connect(alice).toggleTax(togglingTo);

  console.log(`toggled tax to: ${togglingTo}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
