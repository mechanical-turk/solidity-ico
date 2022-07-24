import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { SpaceCoin, SpaceCoin__factory } from "../typechain/index";
import { SeedPhaseEdgeCaseBuilder } from "./edge-case-builder/SeedPhaseEdgeCaseBuilder";

export enum Phase {
  SEED,
  GENERAL,
  OPEN,
}

export const ONE_ETHER = ethers.utils.parseEther("1");

export class Helper {
  constructor(
    public readonly spaceCoinFactory: SpaceCoin__factory,
    public readonly signers: {
      readonly deployer: SignerWithAddress;
      readonly alice: SignerWithAddress;
      readonly bob: SignerWithAddress;
      readonly charlie: SignerWithAddress;
      readonly dan: SignerWithAddress;
      readonly treasury1: SignerWithAddress;
      readonly treasury2: SignerWithAddress;
      readonly treasury3: SignerWithAddress;
      readonly others: SignerWithAddress[];
    },
    private readonly secretSigner: SignerWithAddress // used only internally from within the helper
  ) {}

  public async getSeedPhaseEdgeCase(): Promise<SeedPhaseEdgeCaseBuilder> {
    return SeedPhaseEdgeCaseBuilder.init({ helper: this });
  }

  static async init(): Promise<Helper> {
    const [
      deployer,
      alice,
      bob,
      charlie,
      dan,
      treasury1,
      treasury2,
      treasury3,
      secretSigner,
      ...others
    ] = await ethers.getSigners();
    const spaceCoinFactory = await ethers.getContractFactory("SpaceCoin");
    return new Helper(
      spaceCoinFactory,
      {
        deployer,
        alice,
        bob,
        charlie,
        dan,
        treasury1,
        treasury2,
        treasury3,
        others,
      },
      secretSigner
    );
  }
}
