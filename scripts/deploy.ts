import { ethers } from "hardhat";

async function main() {
  const SpaceCoin = await ethers.getContractFactory("SpaceCoin");
  const [alice, treasury] = await ethers.getSigners();
  const spaceCoin = await SpaceCoin.connect(alice).deploy(treasury.address);

  await spaceCoin.deployed();

  console.log("spaceCoin deployed to:", spaceCoin.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
