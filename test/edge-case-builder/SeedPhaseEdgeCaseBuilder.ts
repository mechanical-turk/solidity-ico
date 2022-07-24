import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { SpaceCoin } from "../../typechain";
import { type Helper, ONE_ETHER, Phase } from "../Helper";
import { GeneralPhaseEdgeCaseBuilder } from "./GeneralPhaseEdgeCaseBuilder";

export type AllSigners = {
  readonly whitelistedAndZeroInvestment: SignerWithAddress;
  readonly whitelistedAndPartiallyInvestedInSeedBelowGeneral: SignerWithAddress;
  readonly whitelistedAndPartiallyInvestedInSeedAboveGeneral: SignerWithAddress;
  readonly whitelistedAndFullyInvestedInSeed: SignerWithAddress;

  readonly whitelistedAndPartiallyInvestedInSeedAndGeneral: SignerWithAddress;
  readonly whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral: SignerWithAddress;
  readonly whitelistedAndOnlyPartiallyInvestedInGeneral: SignerWithAddress;
  readonly whitelistedAndOnlyFullyInvestedInGeneral: SignerWithAddress;
  readonly notWhitelistedAndZeroInvestment: SignerWithAddress;
  readonly notWhitelistedAndPartiallyInvestedInGeneral: SignerWithAddress;
  readonly notWhitelistedAndFullyInvestedInGeneral: SignerWithAddress;

  readonly whitelistedAndPartiallyInvestedInAllPhases: SignerWithAddress;
  readonly whitelistedAndOnlyPartiallyInvestedInOpen: SignerWithAddress;
  readonly whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen: SignerWithAddress;
  readonly notWhitelistedAndPartiallyInvestedInGeneralAndOpen: SignerWithAddress;
  readonly notWhitelistedAndFullyInvestedInGeneralAndPartiallyInvestedInOpen: SignerWithAddress;
};

export class SeedPhaseEdgeCaseBuilder {
  public readonly helper: Helper;

  public readonly spaceCoin: SpaceCoin;

  public readonly allSigners: AllSigners;

  public get signers() {
    return {
      whitelistedAndZeroInvestment:
        this.allSigners.whitelistedAndZeroInvestment,
      whitelistedAndPartiallyInvestedInSeedBelowGeneral:
        this.allSigners.whitelistedAndPartiallyInvestedInSeedBelowGeneral,
      whitelistedAndPartiallyInvestedInSeedAboveGeneral:
        this.allSigners.whitelistedAndPartiallyInvestedInSeedAboveGeneral,
      whitelistedAndFullyInvestedInSeed:
        this.allSigners.whitelistedAndFullyInvestedInSeed,
      notWhitelistedAndZeroInvestment:
        this.allSigners.notWhitelistedAndZeroInvestment,
    };
  }

  public get whitelisted() {
    return [
      this.allSigners.whitelistedAndZeroInvestment,
      this.allSigners.whitelistedAndPartiallyInvestedInSeedBelowGeneral,
      this.allSigners.whitelistedAndPartiallyInvestedInSeedAboveGeneral,
      this.allSigners.whitelistedAndFullyInvestedInSeed,
    ];
  }

  public get canStillInvest() {
    return [
      this.allSigners.whitelistedAndZeroInvestment,
      this.allSigners.whitelistedAndPartiallyInvestedInSeedBelowGeneral,
      this.allSigners.whitelistedAndPartiallyInvestedInSeedAboveGeneral,
    ];
  }

  public get allInvestors() {
    return Object.values(this.signers);
  }

  public get cantInvestAnymore() {
    const canStillInvestSet = new Set(this.canStillInvest);
    return this.allInvestors.filter(
      (investor) => !canStillInvestSet.has(investor)
    );
  }

  constructor(params: {
    readonly helper: Helper;
    readonly spaceCoin: SpaceCoin;
    readonly allSigners: AllSigners;
  }) {
    this.helper = params.helper;

    this.spaceCoin = params.spaceCoin;

    this.allSigners = params.allSigners;
  }

  static async init(params: { helper: Helper }) {
    const { signers, spaceCoinFactory } = params.helper;
    const { alice, treasury1, others } = signers;
    const spaceCoin = await spaceCoinFactory
      .connect(alice)
      .deploy(treasury1.address);

    const whitelistedAndZeroInvestment = others[0];
    const whitelistedAndPartiallyInvestedInSeedBelowGeneral = others[1];
    const whitelistedAndPartiallyInvestedInSeedAboveGeneral = others[2];
    const whitelistedAndFullyInvestedInSeed = others[3];
    const whitelistedAndPartiallyInvestedInSeedAndGeneral = others[4];
    const whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral =
      others[5];
    const whitelistedAndOnlyPartiallyInvestedInGeneral = others[6];
    const whitelistedAndOnlyFullyInvestedInGeneral = others[7];
    const notWhitelistedAndZeroInvestment = others[8];
    const notWhitelistedAndPartiallyInvestedInGeneral = others[9];
    const notWhitelistedAndFullyInvestedInGeneral = others[10];

    const whitelistedAndPartiallyInvestedInAllPhases = others[11];
    const whitelistedAndOnlyPartiallyInvestedInOpen = others[12];
    const whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen =
      others[13];
    const notWhitelistedAndPartiallyInvestedInGeneralAndOpen = others[14];
    const notWhitelistedAndFullyInvestedInGeneralAndPartiallyInvestedInOpen =
      others[15];

    const whitelisted = [
      whitelistedAndZeroInvestment,
      whitelistedAndPartiallyInvestedInSeedBelowGeneral,
      whitelistedAndPartiallyInvestedInSeedAboveGeneral,
      whitelistedAndFullyInvestedInSeed,
      whitelistedAndPartiallyInvestedInSeedAndGeneral,
      whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral,
      whitelistedAndOnlyPartiallyInvestedInGeneral,
      whitelistedAndOnlyFullyInvestedInGeneral,
      whitelistedAndPartiallyInvestedInAllPhases,
      whitelistedAndOnlyPartiallyInvestedInOpen,
      whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen,
    ];

    for (const investor of whitelisted) {
      await spaceCoin.connect(alice).addToWhitelist(investor.address);
      const isWhitelisted = await spaceCoin
        .connect(alice)
        .whitelisted(investor.address);
      if (!isWhitelisted) {
        throw new Error("expected to be whitelisted");
      }
    }

    await spaceCoin
      .connect(whitelistedAndPartiallyInvestedInSeedBelowGeneral)
      .invest({
        value: ONE_ETHER.mul(500),
      });

    await spaceCoin
      .connect(whitelistedAndPartiallyInvestedInSeedAboveGeneral)
      .invest({
        value: ONE_ETHER.mul(1_200),
      });

    await spaceCoin.connect(whitelistedAndFullyInvestedInSeed).invest({
      value: ONE_ETHER.mul(1_500),
    });

    await spaceCoin
      .connect(whitelistedAndPartiallyInvestedInSeedAndGeneral)
      .invest({
        value: ONE_ETHER.mul(500),
      });

    await spaceCoin
      .connect(whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral)
      .invest({
        value: ONE_ETHER.mul(500),
      });

    await spaceCoin.connect(whitelistedAndPartiallyInvestedInAllPhases).invest({
      value: ONE_ETHER.mul(300),
    });

    return new SeedPhaseEdgeCaseBuilder({
      helper: params.helper,
      allSigners: {
        whitelistedAndZeroInvestment,
        whitelistedAndPartiallyInvestedInSeedBelowGeneral,
        whitelistedAndPartiallyInvestedInSeedAboveGeneral,
        whitelistedAndFullyInvestedInSeed,
        whitelistedAndPartiallyInvestedInSeedAndGeneral,
        whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral,
        whitelistedAndOnlyPartiallyInvestedInGeneral,
        whitelistedAndOnlyFullyInvestedInGeneral,
        notWhitelistedAndZeroInvestment,
        notWhitelistedAndPartiallyInvestedInGeneral,
        notWhitelistedAndFullyInvestedInGeneral,
        whitelistedAndPartiallyInvestedInAllPhases,
        whitelistedAndOnlyPartiallyInvestedInOpen,
        whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen,
        notWhitelistedAndPartiallyInvestedInGeneralAndOpen,
        notWhitelistedAndFullyInvestedInGeneralAndPartiallyInvestedInOpen,
      },
      spaceCoin,
    });
  }

  public async advance(): Promise<GeneralPhaseEdgeCaseBuilder> {
    await this.spaceCoin
      .connect(this.helper.signers.alice)
      .advancePhaseFrom(Phase.SEED);

    await this.spaceCoin
      .connect(this.allSigners.whitelistedAndPartiallyInvestedInSeedAndGeneral)
      .invest({
        value: ONE_ETHER.mul(300),
      });

    await this.spaceCoin
      .connect(
        this.allSigners
          .whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral
      )
      .invest({
        value: ONE_ETHER.mul(500),
      });

    await this.spaceCoin
      .connect(this.allSigners.notWhitelistedAndPartiallyInvestedInGeneral)
      .invest({
        value: ONE_ETHER.mul(500),
      });

    await this.spaceCoin
      .connect(this.allSigners.whitelistedAndOnlyPartiallyInvestedInGeneral)
      .invest({
        value: ONE_ETHER.mul(500),
      });

    await this.spaceCoin
      .connect(this.allSigners.whitelistedAndOnlyFullyInvestedInGeneral)
      .invest({
        value: ONE_ETHER.mul(1_000),
      });

    await this.spaceCoin
      .connect(this.allSigners.whitelistedAndPartiallyInvestedInAllPhases)
      .invest({
        value: ONE_ETHER.mul(300),
      });

    await this.spaceCoin
      .connect(
        this.allSigners
          .whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen
      )
      .invest({
        value: ONE_ETHER.mul(1_000),
      });

    await this.spaceCoin
      .connect(this.allSigners.notWhitelistedAndFullyInvestedInGeneral)
      .invest({
        value: ONE_ETHER.mul(1_000),
      });

    await this.spaceCoin
      .connect(
        this.allSigners
          .notWhitelistedAndFullyInvestedInGeneralAndPartiallyInvestedInOpen
      )
      .invest({
        value: ONE_ETHER.mul(1_000),
      });

    await this.spaceCoin
      .connect(
        this.allSigners.notWhitelistedAndPartiallyInvestedInGeneralAndOpen
      )
      .invest({
        value: ONE_ETHER.mul(300),
      });

    const currentPhase = await this.spaceCoin.currentPhase();
    if (currentPhase !== Phase.GENERAL) {
      throw new Error("Expected general phase");
    }

    return new GeneralPhaseEdgeCaseBuilder({
      helper: this.helper,
      spaceCoin: this.spaceCoin,
      allSigners: this.allSigners,
    });
  }
}
