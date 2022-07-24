import { SpaceCoin } from "../../typechain";
import { Helper, ONE_ETHER, Phase } from "../Helper";
import { OpenPhaseEdgeCaseBuilder } from "./OpenPhaseEdgeCaseBuilder";
import { AllSigners } from "./SeedPhaseEdgeCaseBuilder";

export class GeneralPhaseEdgeCaseBuilder {
  public readonly helper: Helper;

  public readonly spaceCoin: SpaceCoin;

  public readonly allSigners: AllSigners;

  public constructor(params: {
    readonly helper: Helper;
    readonly spaceCoin: SpaceCoin;
    readonly allSigners: AllSigners;
  }) {
    this.helper = params.helper;

    this.spaceCoin = params.spaceCoin;

    this.allSigners = params.allSigners;
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
      whitelistedAndPartiallyInvestedInSeedAndGeneral:
        this.allSigners.whitelistedAndPartiallyInvestedInSeedAndGeneral,
      whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral:
        this.allSigners
          .whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral,
      whitelistedAndOnlyPartiallyInvestedInGeneral:
        this.allSigners.whitelistedAndOnlyPartiallyInvestedInGeneral,
      whitelistedAndOnlyFullyInvestedInGeneral:
        this.allSigners.whitelistedAndOnlyFullyInvestedInGeneral,
      notWhitelistedAndPartiallyInvestedInGeneral:
        this.allSigners.notWhitelistedAndPartiallyInvestedInGeneral,
      notWhitelistedAndFullyInvestedInGeneral:
        this.allSigners.notWhitelistedAndFullyInvestedInGeneral,
    };
  }

  public get canStillInvest() {
    return [
      this.allSigners.whitelistedAndZeroInvestment,
      this.allSigners.whitelistedAndPartiallyInvestedInSeedBelowGeneral,
      this.allSigners.whitelistedAndPartiallyInvestedInSeedAndGeneral,
      this.allSigners.whitelistedAndOnlyPartiallyInvestedInGeneral,
      this.allSigners.notWhitelistedAndZeroInvestment,
      this.allSigners.notWhitelistedAndPartiallyInvestedInGeneral,
    ];
  }

  public get whitelisted() {
    return [
      this.allSigners.whitelistedAndZeroInvestment,
      this.allSigners.whitelistedAndPartiallyInvestedInSeedBelowGeneral,
      this.allSigners.whitelistedAndPartiallyInvestedInSeedAboveGeneral,
      this.allSigners.whitelistedAndFullyInvestedInSeed,
      this.allSigners.whitelistedAndPartiallyInvestedInSeedAndGeneral,
      this.allSigners
        .whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral,
      this.allSigners.whitelistedAndOnlyPartiallyInvestedInGeneral,
      this.allSigners.whitelistedAndOnlyFullyInvestedInGeneral,
    ];
  }

  public async advance(): Promise<OpenPhaseEdgeCaseBuilder> {
    await this.spaceCoin
      .connect(this.helper.signers.alice)
      .advancePhaseFrom(Phase.GENERAL);

    await this.spaceCoin
      .connect(this.allSigners.whitelistedAndPartiallyInvestedInAllPhases)
      .invest({
        value: ONE_ETHER.mul(3_000),
      });

    await this.spaceCoin
      .connect(this.allSigners.whitelistedAndOnlyPartiallyInvestedInOpen)
      .invest({
        value: ONE_ETHER.mul(3_000),
      });

    await this.spaceCoin
      .connect(
        this.allSigners
          .whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen
      )
      .invest({
        value: ONE_ETHER.mul(3_000),
      });

    await this.spaceCoin
      .connect(
        this.allSigners.notWhitelistedAndPartiallyInvestedInGeneralAndOpen
      )
      .invest({
        value: ONE_ETHER.mul(3_000),
      });

    await this.spaceCoin
      .connect(
        this.allSigners
          .notWhitelistedAndFullyInvestedInGeneralAndPartiallyInvestedInOpen
      )
      .invest({
        value: ONE_ETHER.mul(3_000),
      });

    return new OpenPhaseEdgeCaseBuilder({
      helper: this.helper,
      spaceCoin: this.spaceCoin,
      allSigners: this.allSigners,
    });
  }
}
