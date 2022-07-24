import { ethers } from "hardhat";

async function main() {
  const SpaceCoin = await ethers.getContractFactory("SpaceCoin");
  const [alice] = await ethers.getSigners();
  const spaceCoin = await SpaceCoin.connect(alice).deploy(
    "0x5B9af6a36823287905df05B4055284490058B417"
  );

  await spaceCoin.deployed();

  console.log("spaceCoin deployed to:", spaceCoin.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
