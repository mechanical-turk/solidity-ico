import { SpaceCoin } from "../../typechain";
import { Helper } from "../Helper";
import { AllSigners } from "./SeedPhaseEdgeCaseBuilder";

export class OpenPhaseEdgeCaseBuilder {
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
      whitelistedAndPartiallyInvestedInAllPhases:
        this.allSigners.whitelistedAndPartiallyInvestedInAllPhases,
      whitelistedAndOnlyPartiallyInvestedInOpen:
        this.allSigners.whitelistedAndOnlyPartiallyInvestedInOpen,
      whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen:
        this.allSigners
          .whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen,
      notWhitelistedAndPartiallyInvestedInGeneralAndOpen:
        this.allSigners.notWhitelistedAndPartiallyInvestedInGeneralAndOpen,
      notWhitelistedAndFullyInvestedInGeneralAndPartiallyInvestedInOpen:
        this.allSigners
          .notWhitelistedAndFullyInvestedInGeneralAndPartiallyInvestedInOpen,
    };
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
      this.allSigners.whitelistedAndPartiallyInvestedInAllPhases,
      this.allSigners.whitelistedAndOnlyPartiallyInvestedInOpen,
      this.allSigners
        .whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen,
    ];
  }

  public get allInvestors() {
    return Object.values(this.signers);
  }

  public get canStillInvest() {
    return this.allInvestors;
  }
}
