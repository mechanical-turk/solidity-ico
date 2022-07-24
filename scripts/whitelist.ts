import { ethers } from "hardhat";
import dotenv from "dotenv";
import { Phase } from "../test/Helper";

dotenv.config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS as string;
  const investorAddress = process.env.INVESTOR_ADDRESS as string;

  const spaceCoin = await ethers.getContractAt("SpaceCoin", contractAddress);
  await spaceCoin.advancePhaseFrom(Phase.GENERAL);
  console.log(`whitelisted: ${investorAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
