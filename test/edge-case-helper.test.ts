import { expect } from "chai";
import { SpaceCoin } from "../typechain";
import { GeneralPhaseEdgeCaseBuilder } from "./edge-case-builder/GeneralPhaseEdgeCaseBuilder";
import { OpenPhaseEdgeCaseBuilder } from "./edge-case-builder/OpenPhaseEdgeCaseBuilder";
import { SeedPhaseEdgeCaseBuilder } from "./edge-case-builder/SeedPhaseEdgeCaseBuilder";
import { Helper, Phase, ONE_ETHER } from "./Helper";

describe("Edge case helper", () => {
  let helper: Helper;
  describe("Phase: Seed", () => {
    let edgeCaseBuilder: SeedPhaseEdgeCaseBuilder;
    let spaceCoin: SpaceCoin;

    beforeEach(async () => {
      helper = await Helper.init();
      edgeCaseBuilder = await helper.getSeedPhaseEdgeCase();
      spaceCoin = edgeCaseBuilder.spaceCoin;
    });

    it("should have 5 investors", async () => {
      const numInvestors = edgeCaseBuilder.allInvestors.length;
      expect(numInvestors).to.equal(5);
    });

    it("should have the current phase at Seed", async () => {
      const currentPhase = await spaceCoin.currentPhase();
      expect(currentPhase).to.equal(Phase.SEED);
    });

    it("should show 0 tokens for <whitelistedAndZeroInvestment>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.whitelistedAndZeroInvestment.address
      );
      expect(tokens).to.equal(0);
    });

    it("should show 2_500 tokens for <whitelistedAndPartiallyInvestedInSeedBelowGeneral>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers
          .whitelistedAndPartiallyInvestedInSeedBelowGeneral.address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(2_500));
    });

    it("should show 6_000 tokens for <whitelistedAndPartiallyInvestedInSeedAboveGeneral>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers
          .whitelistedAndPartiallyInvestedInSeedAboveGeneral.address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(6_000));
    });

    it("should show 7_500 tokens for <whitelistedAndFullyInvestedInSeed>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.whitelistedAndFullyInvestedInSeed.address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(7_500));
    });

    it("should show 0 tokens for <notWhitelistedAndZeroInvestment>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.notWhitelistedAndZeroInvestment.address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(0));
    });
  });

  describe("Phase: General", () => {
    let edgeCaseBuilder: GeneralPhaseEdgeCaseBuilder;
    let spaceCoin: SpaceCoin;

    beforeEach(async () => {
      helper = await Helper.init();
      edgeCaseBuilder = await (await helper.getSeedPhaseEdgeCase()).advance();
      spaceCoin = edgeCaseBuilder.spaceCoin;
    });

    it("should have 11 investors", async () => {
      const numInvestors = edgeCaseBuilder.allInvestors.length;
      expect(numInvestors).to.equal(11);
    });

    it("should have the current phase at General", async () => {
      const currentPhase = await spaceCoin.currentPhase();
      expect(currentPhase).to.equal(Phase.GENERAL);
    });

    it("should show 4_000 tokens for <whitelistedAndPartiallyInvestedInSeedAndGeneral>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.whitelistedAndPartiallyInvestedInSeedAndGeneral
          .address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(4_000));
    });

    it("should show 5_000 tokens for <whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers
          .whitelistedAndPartiallyInvestedInSeedAndFullyInvestedInGeneral
          .address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(5_000));
    });

    it("should show 2_500 tokens for <whitelistedAndOnlyPartiallyInvestedInGeneral>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.whitelistedAndOnlyPartiallyInvestedInGeneral
          .address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(2_500));
    });

    it("should show 5_000 tokens for <whitelistedAndOnlyFullyInvestedInGeneral>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.whitelistedAndOnlyFullyInvestedInGeneral.address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(5_000));
    });

    it("should show 2_500 tokens for <notWhitelistedAndPartiallyInvestedInGeneral>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.notWhitelistedAndPartiallyInvestedInGeneral
          .address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(2_500));
    });

    it("should show 5_000 tokens for <notWhitelistedAndFullyInvestedInGeneral>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.notWhitelistedAndFullyInvestedInGeneral.address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(5_000));
    });
  });

  describe("Phase: Open", () => {
    let edgeCaseBuilder: OpenPhaseEdgeCaseBuilder;
    let spaceCoin: SpaceCoin;

    beforeEach(async () => {
      helper = await Helper.init();
      edgeCaseBuilder = await (
        await (await helper.getSeedPhaseEdgeCase()).advance()
      ).advance();
      spaceCoin = edgeCaseBuilder.spaceCoin;
    });

    it("should have 16 investors", async () => {
      const numInvestors = edgeCaseBuilder.allInvestors.length;
      expect(numInvestors).to.equal(16);
    });

    it("should have the current phase at Open", async () => {
      const currentPhase = await spaceCoin.currentPhase();
      expect(currentPhase).to.equal(Phase.OPEN);
    });

    it("should show 18_000 tokens for <whitelistedAndPartiallyInvestedInAllPhases>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.whitelistedAndPartiallyInvestedInAllPhases
          .address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(18_000));
    });

    it("should show 15_000 tokens for <whitelistedAndOnlyPartiallyInvestedInOpen>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers.whitelistedAndOnlyPartiallyInvestedInOpen
          .address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(15_000));
    });

    it("should show 20_000 tokens for <whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers
          .whitelistedAndOnlyFullyInvestedInGeneralAndPartiallyInvestedInOpen
          .address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(20_000));
    });

    it("should show 16_500 tokens for <notWhitelistedAndPartiallyInvestedInGeneralAndOpen>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers
          .notWhitelistedAndPartiallyInvestedInGeneralAndOpen.address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(16_500));
    });

    it("should show 20_000 tokens for <notWhitelistedAndFullyInvestedInGeneralAndPartiallyInvestedInOpen>", async () => {
      const tokens = await spaceCoin.invested(
        edgeCaseBuilder.signers
          .notWhitelistedAndFullyInvestedInGeneralAndPartiallyInvestedInOpen
          .address
      );
      expect(tokens).to.equal(ONE_ETHER.mul(20_000));
    });
  });
});
