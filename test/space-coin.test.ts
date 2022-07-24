import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { SpaceCoin } from "../typechain";
import { Helper, ONE_ETHER, Phase } from "./Helper";
import { ethers } from "hardhat";
import { GeneralPhaseEdgeCaseBuilder } from "./edge-case-builder/GeneralPhaseEdgeCaseBuilder";
import { OpenPhaseEdgeCaseBuilder } from "./edge-case-builder/OpenPhaseEdgeCaseBuilder";
import { BigNumber } from "ethers";

describe("SpaceCoin", () => {
  let helper: Helper;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;
  let dan: SignerWithAddress;
  let treasury1: SignerWithAddress;
  let treasury2: SignerWithAddress;
  let treasury3: SignerWithAddress;
  let others: SignerWithAddress[];

  beforeEach(async () => {
    helper = await Helper.init();
    const { signers } = helper;
    alice = signers.alice;
    bob = signers.bob;
    charlie = signers.charlie;
    dan = signers.dan;
    treasury1 = signers.treasury1;
    treasury2 = signers.treasury2;
    treasury3 = signers.treasury3;
    others = signers.others;
  });

  describe("deploying", () => {
    it("should successfully deploy the contract", async () => {
      const spaceCoin = await helper.spaceCoinFactory
        .connect(alice)
        .deploy(treasury1.address);
      expect(spaceCoin.address).to.be.a("string");
    });
  });

  describe("initial state", () => {
    let spaceCoin: SpaceCoin;

    beforeEach(async () => {
      spaceCoin = await helper.spaceCoinFactory
        .connect(alice)
        .deploy(treasury1.address);
    });

    it("should set the deployer as the contract owner", async () => {
      const owner = await spaceCoin.owner();
      expect(owner).to.equal(alice.address);
    });

    it("should set the treasury address from the constructor", async () => {
      const treasury = await spaceCoin.treasury();
      expect(treasury).to.equal(treasury1.address);
    });

    it("should set the tax flag to false", async () => {
      const isTaxed = await spaceCoin.isTaxed();
      expect(isTaxed).to.equal(false);
    });

    it("should set the isPaused flag to false", async () => {
      const isPaused = await spaceCoin.isPaused();
      expect(isPaused).to.equal(false);
    });

    it("should default all addresses to false on the whitelist", async () => {
      for (const signer of [alice, bob, charlie, dan]) {
        const isWhitelised = await spaceCoin
          .connect(alice)
          .whitelisted(signer.address);
        expect(isWhitelised).to.equal(false);
      }
    });
  });

  describe("Total supply", () => {
    let spaceCoin: SpaceCoin;

    beforeEach(async () => {
      spaceCoin = await helper.spaceCoinFactory
        .connect(alice)
        .deploy(treasury1.address);

      await spaceCoin.connect(alice).advancePhaseFrom(Phase.SEED);
      await spaceCoin.connect(alice).advancePhaseFrom(Phase.GENERAL);
    });

    describe("Tax: On", () => {
      beforeEach(async () => {
        await spaceCoin.connect(alice).toggleTax(true);
      });

      it("should max out when investing 100_000 ETH", async () => {
        await spaceCoin.connect(bob).invest({
          value: ONE_ETHER.mul(100_000),
        });
        await spaceCoin
          .connect(bob)
          .claimTokens(ONE_ETHER.mul(500_000), bob.address);
        const totalSupply = await spaceCoin.connect(bob).totalSupply();
        expect(totalSupply).to.equal(ONE_ETHER.mul(500_000));
        await expect(
          spaceCoin.connect(bob).invest({
            value: 1,
          })
        ).to.be.reverted;
      });
    });

    describe("Tax: Off", () => {
      beforeEach(async () => {
        await spaceCoin.connect(alice).toggleTax(true);
      });

      it("should max out when investing 100_000 ETH", async () => {
        await spaceCoin.connect(bob).invest({
          value: ONE_ETHER.mul(100_000),
        });
        await spaceCoin
          .connect(bob)
          .claimTokens(ONE_ETHER.mul(500_000), bob.address);
        const totalSupply = await spaceCoin.connect(bob).totalSupply();
        expect(totalSupply).to.be.equal(ONE_ETHER.mul(500_000));
        await expect(
          spaceCoin.connect(bob).invest({
            value: 1,
          })
        ).to.be.reverted;
      });
    });
  });

  describe("Pausing", () => {
    let spaceCoin: SpaceCoin;
    let nonOwners: SignerWithAddress[] = [];

    describe("Ongoing fundraising", () => {
      beforeEach(async () => {
        spaceCoin = await helper.spaceCoinFactory
          .connect(alice)
          .deploy(treasury1.address);
        nonOwners = [bob, charlie, dan, treasury1, treasury2, treasury3];
      });

      it("should allow the owner to pause a fundraise", async () => {
        await spaceCoin.connect(alice).togglePaused(true);
        const isPaused = await spaceCoin.isPaused();
        expect(isPaused).to.be.equal(true);
      });

      it("should block anyone other than the owner from pausing a fundraise", async () => {
        for (const signer of nonOwners) {
          await expect(
            spaceCoin.connect(signer).togglePaused(true)
          ).to.be.revertedWith("owner only");
        }
      });

      it("should emit a ToggledFundraisePause event if the owner pauses the fundraise", async () => {
        await expect(spaceCoin.connect(alice).togglePaused(true))
          .to.emit(spaceCoin, "ToggledFundraisePause")
          .withArgs(true);
      });
    });

    describe("Paused fundraising", () => {
      beforeEach(async () => {
        spaceCoin = await helper.spaceCoinFactory
          .connect(alice)
          .deploy(treasury1.address);
        await spaceCoin.connect(alice).togglePaused(true);
      });

      it("should allow the owner to resume a fundraise", async () => {
        await spaceCoin.connect(alice).togglePaused(false);
        const isPaused = await spaceCoin.isPaused();
        expect(isPaused).to.be.equal(false);
      });

      it("should block anyone other than the owner from resuming a fundraise", async () => {
        for (const signer of nonOwners) {
          await expect(
            spaceCoin.connect(signer).togglePaused(false)
          ).to.be.revertedWith("owner only");
        }
      });

      it("should emit a ToggledFundraisePause event if the owner resumes the fundraise", async () => {
        await expect(spaceCoin.connect(alice).togglePaused(false))
          .to.emit(spaceCoin, "ToggledFundraisePause")
          .withArgs(false);
      });
    });
  });

  describe("tax", () => {
    let spaceCoin: SpaceCoin;
    let investors: SignerWithAddress[];

    const INVESTED = ONE_ETHER.mul(100);

    beforeEach(async () => {
      spaceCoin = await helper.spaceCoinFactory
        .connect(alice)
        .deploy(treasury1.address);

      investors = [bob, charlie, dan];

      await spaceCoin.connect(alice).advancePhaseFrom(Phase.SEED);
      await spaceCoin.connect(alice).advancePhaseFrom(Phase.GENERAL);

      for (const investor of investors) {
        await spaceCoin.connect(investor).invest({
          value: INVESTED,
        });
      }
    });

    const getBalances = async (params: {
      contract: SpaceCoin;
      sender: SignerWithAddress;
      treasury: SignerWithAddress;
      recipient: SignerWithAddress;
    }) => {
      return {
        sender: await params.contract.balanceOf(params.sender.address),
        treasury: await params.contract.balanceOf(params.treasury.address),
        recipient: await params.contract.balanceOf(params.recipient.address),
      };
    };

    describe("on", () => {
      beforeEach(async () => {
        await spaceCoin.connect(alice).toggleTax(true);
        const isTaxed = await spaceCoin.isTaxed();
        if (!isTaxed) {
          throw new Error("expected taxed");
        }
      });

      it("should add A 2% tax on every transferFrom", async () => {
        for (let i = 0; i < investors.length; i++) {
          const investor = investors[i];
          await spaceCoin
            .connect(investor)
            .claimTokens(INVESTED, investor.address);

          const before = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          const transferAmount = ONE_ETHER.mul(i + 1);
          const expectedTax = transferAmount.div(100).mul(2);
          const expectedTransfer = transferAmount.div(100).mul(98);

          await spaceCoin
            .connect(investor)
            .approve(bob.address, transferAmount);

          await spaceCoin
            .connect(bob)
            .transferFrom(investor.address, alice.address, transferAmount);

          const after = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          expect(before.sender.sub(after.sender)).to.equal(transferAmount);
          expect(after.recipient.sub(before.recipient)).to.equal(
            expectedTransfer
          );
          expect(after.treasury.sub(before.treasury)).to.equal(expectedTax);
        }
      });

      it("should add A 2% tax on every transfer", async () => {
        for (let i = 0; i < investors.length; i++) {
          const investor = investors[i];
          await spaceCoin
            .connect(investor)
            .claimTokens(INVESTED, investor.address);

          const before = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          const transferAmount = ONE_ETHER.mul(i + 1);
          const expectedTax = transferAmount.div(100).mul(2);
          const expectedTransfer = transferAmount.div(100).mul(98);

          await spaceCoin
            .connect(investor)
            .transfer(alice.address, transferAmount);

          const after = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          expect(before.sender.sub(after.sender)).to.equal(transferAmount);
          expect(after.recipient.sub(before.recipient)).to.equal(
            expectedTransfer
          );
          expect(after.treasury.sub(before.treasury)).to.equal(expectedTax);
        }
      });

      it("should add the 2% tax on minting as well", async () => {
        for (let i = 0; i < investors.length; i++) {
          const investor = investors[i];

          const before = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          const claiming = INVESTED.div(10).mul(i + 1);

          await spaceCoin
            .connect(investor)
            .claimTokens(claiming, investor.address);

          const expectedTax = claiming.div(100).mul(2);
          const expectedTransfer = claiming.div(100).mul(98);

          const after = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          expect(after.sender.sub(before.sender)).to.equal(expectedTransfer);
          expect(after.treasury.sub(before.treasury)).to.equal(expectedTax);
        }
      });

      it("should allow the owner to toggle the tax off", async () => {
        await expect(spaceCoin.connect(alice).toggleTax(false)).to.be.not
          .reverted;
      });

      it("should set the tax to off once the owner toggles it off", async () => {
        await spaceCoin.connect(alice).toggleTax(false);
        const isTaxed = await spaceCoin.isTaxed();
        expect(isTaxed).to.equal(false);
      });

      it("should not allow anyone other than the owner to toggle the tax off", async () => {
        for (const signer of [bob, charlie, dan]) {
          expect(spaceCoin.connect(signer).toggleTax(false)).to.be.revertedWith(
            "owner only"
          );
        }
      });

      it("should emit a ToggledTax event when the owner toggles the tax off", async () => {
        await expect(spaceCoin.connect(alice).toggleTax(false))
          .to.emit(spaceCoin, "ToggledTax")
          .withArgs(false);
      });
    });

    describe("off", () => {
      beforeEach(async () => {
        const isTaxed = await spaceCoin.isTaxed();
        if (isTaxed) {
          throw new Error("expected not taxed");
        }
      });

      it("should not take any tax cuts on token transfers via transfer()", async () => {
        for (let i = 0; i < investors.length; i++) {
          const investor = investors[i];
          await spaceCoin
            .connect(investor)
            .claimTokens(INVESTED, investor.address);

          const before = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          const transferAmount = ONE_ETHER.mul(i + 1);

          await spaceCoin
            .connect(investor)
            .transfer(alice.address, transferAmount);

          const after = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          expect(before.sender.sub(after.sender)).to.equal(transferAmount);
          expect(after.recipient.sub(before.recipient)).to.equal(
            transferAmount
          );
          expect(after.treasury.sub(before.treasury)).to.equal(0);
        }
      });

      it("should not take any tax cuts on token transfers via transferFrom()", async () => {
        for (let i = 0; i < investors.length; i++) {
          const investor = investors[i];
          await spaceCoin
            .connect(investor)
            .claimTokens(INVESTED, investor.address);

          const before = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          const transferAmount = ONE_ETHER.mul(i + 1);

          await spaceCoin
            .connect(investor)
            .approve(bob.address, transferAmount);

          await spaceCoin
            .connect(bob)
            .transferFrom(investor.address, alice.address, transferAmount);

          const after = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          expect(before.sender.sub(after.sender)).to.equal(transferAmount);
          expect(after.recipient.sub(before.recipient)).to.equal(
            transferAmount
          );
          expect(after.treasury.sub(before.treasury)).to.equal(0);
        }
      });

      it("should not add the 2% tax on minting either", async () => {
        for (let i = 0; i < investors.length; i++) {
          const investor = investors[i];

          const before = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          const claiming = INVESTED.div(10).mul(i + 1);

          await spaceCoin
            .connect(investor)
            .claimTokens(claiming, investor.address);

          const after = await getBalances({
            contract: spaceCoin,
            sender: investor,
            treasury: treasury1,
            recipient: alice,
          });

          expect(after.sender.sub(before.sender)).to.equal(claiming);
          expect(after.treasury.sub(before.treasury)).to.equal(0);
        }
      });

      it("should allow the owner to toggle the tax on", async () => {
        await expect(spaceCoin.connect(alice).toggleTax(true)).to.be.not
          .reverted;
      });

      it("should set the tax to on once the owner toggles it on", async () => {
        await spaceCoin.connect(alice).toggleTax(true);
        const isTaxed = await spaceCoin.isTaxed();
        expect(isTaxed).to.equal(true);
      });

      it("should not allow anyone other than the owner to toggle the tax on", async () => {
        for (const signer of [bob, charlie, dan]) {
          expect(spaceCoin.connect(signer).toggleTax(true)).to.be.revertedWith(
            "owner only"
          );
        }
      });

      it("should emit a ToggledTax event when the owner toggles the tax on", async () => {
        await expect(spaceCoin.connect(alice).toggleTax(true))
          .to.emit(spaceCoin, "ToggledTax")
          .withArgs(true);
      });
    });
  });

  describe("Whitelisting", () => {
    let spaceCoin: SpaceCoin;
    let nonOwners: SignerWithAddress[] = [];

    beforeEach(async () => {
      spaceCoin = await helper.spaceCoinFactory
        .connect(alice)
        .deploy(treasury1.address);
      nonOwners = [bob, charlie, dan, treasury1, treasury2, treasury3];
    });

    it("should allow the owner to add any address to the whitelist", async () => {
      const investors = [alice].concat(nonOwners);
      for (const investor of investors) {
        const before = await spaceCoin.whitelisted(investor.address);
        expect(before).to.equal(false);
        await spaceCoin.connect(alice).addToWhitelist(investor.address);
        const after = await spaceCoin.whitelisted(investor.address);
        expect(after).to.equal(true);
      }
    });

    it("should prevent anyone other than the owner from whitelisting an address", async () => {
      const investors = [alice].concat(nonOwners);
      for (const signer of nonOwners) {
        for (const investor of investors) {
          await expect(
            spaceCoin.connect(signer).addToWhitelist(investor.address)
          ).to.be.revertedWith("owner only");
        }
      }
    });

    it("should fire a AddedToWhitelist event when the owner whitelists an address", async () => {
      const investors = [alice].concat(nonOwners);
      for (const investor of investors) {
        await expect(spaceCoin.connect(alice).addToWhitelist(investor.address))
          .to.emit(spaceCoin, "AddedToWhitelist")
          .withArgs(investor.address);
      }
    });
  });

  describe("Advancing phases", () => {
    let spaceCoin: SpaceCoin;
    let nonOwners: SignerWithAddress[] = [];

    beforeEach(async () => {
      nonOwners = [bob, charlie, dan, treasury1, treasury2, treasury3];
    });

    describe("From Seed", () => {
      beforeEach(async () => {
        spaceCoin = await helper.spaceCoinFactory
          .connect(alice)
          .deploy(treasury1.address);
      });

      it("should allow the owner to manually advance to General", async () => {
        const before = await spaceCoin.connect(alice).currentPhase();
        expect(before).to.equal(Phase.SEED);
        await spaceCoin.connect(alice).advancePhaseFrom(Phase.SEED);
        const after = await spaceCoin.connect(alice).currentPhase();
        expect(after).to.equal(Phase.GENERAL);
      });

      it("should block anyone other than the owner from advancing", async () => {
        for (const signer of nonOwners) {
          await expect(
            spaceCoin.connect(signer).advancePhaseFrom(Phase.SEED)
          ).to.be.revertedWith("owner only");
        }
      });

      it("should block the advancing if the from value does not match the current value", async () => {
        for (const wrongPhase of [Phase.GENERAL, Phase.OPEN]) {
          await expect(
            spaceCoin.connect(alice).advancePhaseFrom(wrongPhase)
          ).to.be.revertedWith("from not current");
        }
      });

      it("should emit a AdvancedPhase event when the owner manually advances", async () => {
        await expect(spaceCoin.connect(alice).advancePhaseFrom(Phase.SEED))
          .to.emit(spaceCoin, "AdvancedPhase")
          .withArgs(Phase.GENERAL);
      });
    });

    describe("From General", () => {
      beforeEach(async () => {
        spaceCoin = await helper.spaceCoinFactory
          .connect(alice)
          .deploy(treasury1.address);
        await spaceCoin.connect(alice).advancePhaseFrom(Phase.SEED);
      });

      it("should allow the owner to manually advance to Open", async () => {
        const before = await spaceCoin.connect(alice).currentPhase();
        expect(before).to.equal(Phase.GENERAL);
        await spaceCoin.connect(alice).advancePhaseFrom(Phase.GENERAL);
        const after = await spaceCoin.connect(alice).currentPhase();
        expect(after).to.equal(Phase.OPEN);
      });

      it("should block anyone other than the owner from advancing", async () => {
        for (const signer of nonOwners) {
          await expect(
            spaceCoin.connect(signer).advancePhaseFrom(Phase.GENERAL)
          ).to.be.revertedWith("owner only");
        }
      });

      it("should block the advancing if the from value does not match the current value", async () => {
        for (const wrongPhase of [Phase.SEED, Phase.OPEN]) {
          await expect(
            spaceCoin.connect(alice).advancePhaseFrom(wrongPhase)
          ).to.be.revertedWith("from not current");
        }
      });

      it("should emit a AdvancedPhase event when the owner manually advances", async () => {
        await expect(spaceCoin.connect(alice).advancePhaseFrom(Phase.GENERAL))
          .to.emit(spaceCoin, "AdvancedPhase")
          .withArgs(Phase.OPEN);
      });
    });

    describe("From Open", () => {
      beforeEach(async () => {
        spaceCoin = await helper.spaceCoinFactory
          .connect(alice)
          .deploy(treasury1.address);
        await spaceCoin.connect(alice).advancePhaseFrom(Phase.SEED);
        await spaceCoin.connect(alice).advancePhaseFrom(Phase.GENERAL);
      });

      it("should revert if owner attempts to advance", async () => {
        await expect(
          spaceCoin.connect(alice).advancePhaseFrom(Phase.OPEN)
        ).to.be.revertedWith("advanced open");
      });

      it("should block anyone other than the owner from advancing", async () => {
        for (const signer of nonOwners) {
          await expect(
            spaceCoin.connect(signer).advancePhaseFrom(Phase.OPEN)
          ).to.be.revertedWith("owner only");
        }
      });
    });
  });

  describe("Exchange rate", () => {
    let investors: SignerWithAddress[] = [];
    let spaceCoin: SpaceCoin;

    beforeEach(async () => {
      investors = [bob, charlie, dan];
      spaceCoin = await helper.spaceCoinFactory
        .connect(alice)
        .deploy(treasury1.address);
      await spaceCoin.connect(alice).advancePhaseFrom(Phase.SEED);
      await spaceCoin.connect(alice).advancePhaseFrom(Phase.GENERAL);
    });

    it("should trade at 1 ETH to 4.9 tokens when taxed", async () => {
      await spaceCoin.connect(alice).toggleTax(true);
      const isTaxed = await spaceCoin.isTaxed();
      if (!isTaxed) {
        throw new Error("Expected taxed");
      }
      const investment = ONE_ETHER;
      for (const investor of investors) {
        await spaceCoin.connect(investor).invest({
          value: investment,
        });
        const entitledTo = await spaceCoin.invested(investor.address);
        expect(entitledTo).to.equal(investment.mul(5));
        await spaceCoin
          .connect(investor)
          .claimTokens(entitledTo, investor.address);
        const balance = await spaceCoin.balanceOf(investor.address);
        expect(balance).to.equal(investment.mul(49).div(10));

        expect(await spaceCoin.invested(investor.address)).to.equal(0);
      }
    });

    it("should trade at 1 ETH to 5 tokens when not taxed", async () => {
      const isTaxed = await spaceCoin.isTaxed();
      if (isTaxed) {
        throw new Error("Expected not taxed");
      }
      const investment = ONE_ETHER;
      for (const investor of investors) {
        await spaceCoin.connect(investor).invest({
          value: investment,
        });
        const entitledTo = await spaceCoin.invested(investor.address);
        expect(entitledTo).to.equal(investment.mul(5));
        await spaceCoin
          .connect(investor)
          .claimTokens(entitledTo, investor.address);
        const balance = await spaceCoin.balanceOf(investor.address);
        expect(balance).to.equal(investment.mul(5));

        expect(await spaceCoin.invested(investor.address)).to.equal(0);
      }
    });
  });

  describe("Claiming tokens", async () => {
    describe("Phase: Seed", () => {
      it("should block from claiming the ERC-20 tokens", async () => {
        const edgeCaseBuilder = await helper.getSeedPhaseEdgeCase();
        for (const signer of edgeCaseBuilder.whitelisted) {
          await expect(
            edgeCaseBuilder.spaceCoin
              .connect(signer)
              .claimTokens(1, signer.address)
          ).to.be.revertedWith("wrong phase");
        }
      });
    });

    describe("Phase: General", () => {
      it("should block from claiming the ERC-20 tokens", async () => {
        const edgeCaseBuilder = await (
          await helper.getSeedPhaseEdgeCase()
        ).advance();

        for (const investor of edgeCaseBuilder.allInvestors) {
          await expect(
            edgeCaseBuilder.spaceCoin
              .connect(investor)
              .claimTokens(1, investor.address)
          ).to.be.revertedWith("wrong phase");
        }
      });
    });

    describe("Phase: Open", () => {
      it("should block from claiming more than invested", async () => {
        const edgeCaseBuilder = await (
          await (await helper.getSeedPhaseEdgeCase()).advance()
        ).advance();
        const { spaceCoin } = edgeCaseBuilder;
        for (const investor of edgeCaseBuilder.allInvestors) {
          await expect(
            spaceCoin
              .connect(investor)
              .claimTokens(ONE_ETHER.mul(99999999), investor.address)
          ).to.be.revertedWith("insufficient investment");
        }
      });

      it("should allow anyone to claim their ERC-20 tokens when tax is off", async () => {
        const invested: {
          investor: SignerWithAddress;
          entitledTo: BigNumber;
        }[] = [];
        const edgeCaseBuilder = await (
          await (await helper.getSeedPhaseEdgeCase()).advance()
        ).advance();
        const { spaceCoin } = edgeCaseBuilder;
        for (const investor of edgeCaseBuilder.allInvestors) {
          const entitledTo = await spaceCoin.invested(investor.address);
          if (entitledTo.gt(0)) {
            invested.push({
              investor,
              entitledTo,
            });
          }
        }
        if (invested.length < 5) {
          throw new Error("expected at least 5 invested investors");
        }

        for (const { investor, entitledTo } of invested) {
          const balanceBefore = await spaceCoin.balanceOf(investor.address);
          await spaceCoin
            .connect(investor)
            .claimTokens(entitledTo, investor.address);
          const balanceAfter = await spaceCoin.balanceOf(investor.address);
          expect(balanceAfter.sub(balanceBefore)).to.equal(entitledTo);
        }
      });

      it("should allow anyone to claim their ERC-20 tokens when tax is on", async () => {
        const invested: {
          investor: SignerWithAddress;
          entitledTo: BigNumber;
        }[] = [];
        const edgeCaseBuilder = await (
          await (await helper.getSeedPhaseEdgeCase()).advance()
        ).advance();
        const { spaceCoin } = edgeCaseBuilder;
        await spaceCoin.connect(alice).toggleTax(true);
        for (const investor of edgeCaseBuilder.allInvestors) {
          const entitledTo = await spaceCoin.invested(investor.address);
          if (entitledTo.gt(0)) {
            invested.push({
              investor,
              entitledTo,
            });
          }
        }
        if (invested.length < 5) {
          throw new Error("expected at least 5 invested investors");
        }

        for (const { investor, entitledTo } of invested) {
          const balanceBefore = await spaceCoin.balanceOf(investor.address);
          await spaceCoin
            .connect(investor)
            .claimTokens(entitledTo, investor.address);
          const balanceAfter = await spaceCoin.balanceOf(investor.address);
          const expected = entitledTo.div(100).mul(98);
          expect(balanceAfter.sub(balanceBefore)).to.equal(expected);
        }
      });
    });
  });

  describe("Fundraising", () => {
    let nonOwners: SignerWithAddress[] = [];

    beforeEach(async () => {
      nonOwners = [bob, charlie, dan, treasury1, treasury2, treasury3];
    });

    describe("Phase: Seed", () => {
      let spaceCoin: SpaceCoin;
      beforeEach(async () => {
        spaceCoin = await helper.spaceCoinFactory
          .connect(alice)
          .deploy(treasury1.address);
      });

      describe("not whitelisted", () => {
        it("should block from claiming the ERC-20 tokens", async () => {
          const signers = [alice].concat(nonOwners);
          for (const signer of signers) {
            await expect(
              spaceCoin.connect(signer).claimTokens(ONE_ETHER, signer.address)
            ).to.be.revertedWith("wrong phase");
          }
        });

        it("should block all investments if the fundraising is paused", async () => {
          const signers = [alice].concat(nonOwners);
          await spaceCoin.connect(alice).togglePaused(true);
          const paused = await spaceCoin.connect(alice).isPaused();
          if (!paused) {
            throw new Error("expected paused");
          }
          for (const signer of signers) {
            await expect(
              spaceCoin.connect(signer).invest({
                value: ONE_ETHER,
              })
            ).to.be.revertedWith("paused");
          }
        });

        it("should block investments even if the fundraising is not paused", async () => {
          const signers = [alice].concat(nonOwners);
          const paused = await spaceCoin.connect(alice).isPaused();
          if (paused) {
            throw new Error("expected not paused");
          }
          for (const signer of signers) {
            await expect(
              spaceCoin.connect(signer).invest({
                value: ONE_ETHER,
              })
            ).to.be.revertedWith("whitelist only");
          }
        });
      });

      describe("whitelisted", () => {
        let whitelisted: SignerWithAddress[];
        beforeEach(async () => {
          spaceCoin = await helper.spaceCoinFactory
            .connect(alice)
            .deploy(treasury1.address);
          whitelisted = others;
          for (const signer of whitelisted) {
            await spaceCoin.connect(alice).addToWhitelist(signer.address);
          }
        });

        it("should block all investments if the fundraising is paused", async () => {
          await spaceCoin.connect(alice).togglePaused(true);
          const paused = await spaceCoin.connect(alice).isPaused();
          if (!paused) {
            throw new Error("expected paused");
          }
          for (const signer of whitelisted) {
            await expect(
              spaceCoin.connect(signer).invest({
                value: ONE_ETHER,
              })
            ).to.be.revertedWith("paused");
          }
        });

        it("should block investments if cumulative total >= 15_000 ETH", async () => {
          const [zeroInvestor, ...allInInvestors] = whitelisted.slice(0, 11);
          if (allInInvestors.length !== 10) {
            throw new Error("Expected 10 investors");
          }
          for (const investor of allInInvestors) {
            await spaceCoin.connect(investor).invest({
              value: ONE_ETHER.mul(1_500),
            });
          }
          const contractBalance = await ethers.provider.getBalance(
            spaceCoin.address
          );
          if (!contractBalance.eq(ONE_ETHER.mul(15_000))) {
            throw new Error("Expected 15_000 ETH in balance");
          }
          const investedSupply = await spaceCoin
            .connect(alice)
            .investedSupply();
          if (!investedSupply.eq(ONE_ETHER.mul(75_000))) {
            throw new Error("Expected a total supply of 75_000 * 10^18");
          }
          await expect(
            spaceCoin.connect(zeroInvestor).invest({
              value: "1", // investing the absolute minimum
            })
          ).to.be.revertedWith("above total limit");
        });

        it("should block investments if personal total >= 1_500 ETH", async () => {
          const investors = whitelisted.slice(0, 9);
          if (investors.length !== 9) {
            throw new Error("Expected 9 investors");
          }
          for (const investor of investors) {
            await spaceCoin.connect(investor).invest({
              value: ONE_ETHER.mul(1_500),
            });
            const invested = await spaceCoin
              .connect(investor)
              .invested(investor.address);
            if (!invested.eq(ONE_ETHER.mul(7_500))) {
              throw new Error("Expected personal investment total to be 7_500");
            }
            await expect(
              spaceCoin.connect(investor).invest({
                value: "1", // investing the absolute minimum
              })
            ).to.be.revertedWith("above personal limit");
          }
        });

        it("should allow investments if personal total + current investment <= 1_500 AND cumulative total < 15_000", async () => {
          const investors = whitelisted.slice(0, 9);
          if (investors.length !== 9) {
            throw new Error("Expected 9 investors");
          }
          for (const investor of investors) {
            await spaceCoin.connect(investor).invest({
              value: ONE_ETHER.mul(1_500).sub(1),
            });
            const invested = await spaceCoin
              .connect(investor)
              .invested(investor.address);
            if (!invested.eq(ONE_ETHER.mul(7_500).sub(5))) {
              throw new Error(
                "Expected personal investment total to be 7_499_999...._995"
              );
            }
            await spaceCoin.connect(investor).invest({
              value: "1", // investing the absolute minimum
            });
            const investedAgain = await spaceCoin
              .connect(investor)
              .invested(investor.address);
            expect(investedAgain).to.equal(ONE_ETHER.mul(7_500));
          }
        });

        it("should block investments if personal total + current investment > 1_500", async () => {
          const investors = whitelisted.slice(0, 9);
          if (investors.length !== 9) {
            throw new Error("Expected 9 investors");
          }
          for (const investor of investors) {
            await spaceCoin.connect(investor).invest({
              value: ONE_ETHER.mul(1_500).sub(1),
            });
            const invested = await spaceCoin
              .connect(investor)
              .invested(investor.address);
            if (!invested.eq(ONE_ETHER.mul(7_500).sub(5))) {
              throw new Error(
                "Expected personal investment total to be 7_499_999...._995"
              );
            }
            await expect(
              spaceCoin.connect(investor).invest({
                value: "2",
              })
            ).to.be.revertedWith("above personal limit");
          }
        });

        it("should block investment if msg.value is 0", async () => {
          const investors = whitelisted.slice(0, 9);
          if (investors.length !== 9) {
            throw new Error("Expected 9 investors");
          }
          for (const investor of investors) {
            await expect(
              spaceCoin.connect(investor).invest({
                value: 0,
              })
            ).to.be.revertedWith("investing 0");
          }
        });

        it("should emit a ReachedTotalPhaseLimit event when the total investments reach 15,000 ETH", async () => {
          const [lastInvestor, ...allInvestors] = whitelisted.slice(0, 10);
          if (allInvestors.length !== 9) {
            throw new Error("Expected 9 investors");
          }
          for (const investor of allInvestors) {
            await spaceCoin.connect(investor).invest({
              value: ONE_ETHER.mul(1_500),
            });
          }
          await expect(
            spaceCoin.connect(lastInvestor).invest({
              value: ONE_ETHER.mul(1_500),
            })
          )
            .to.emit(spaceCoin, "ReachedTotalPhaseLimit")
            .withArgs(Phase.SEED, lastInvestor.address);
        });

        it("should emit a ReachedPersonalLimit event when the personal investments reach 1,500 ETH", async () => {
          const investors = whitelisted.slice(0, 10);
          if (investors.length !== 10) {
            throw new Error("Expected 10 investors");
          }
          for (const investor of investors) {
            await expect(
              spaceCoin.connect(investor).invest({
                value: ONE_ETHER.mul(1_500),
              })
            )
              .to.emit(spaceCoin, "ReachedPersonalLimit")
              .withArgs(Phase.SEED, investor.address);
          }
        });
      });

      describe("whitelisted and fully invested", () => {
        let investors: SignerWithAddress[];

        beforeEach(async () => {
          spaceCoin = await helper.spaceCoinFactory
            .connect(alice)
            .deploy(treasury1.address);
          investors = others.slice(0, 9);
          if (investors.length !== 9) {
            throw new Error("Expected 9 investors");
          }
          for (const signer of investors) {
            await spaceCoin.connect(alice).addToWhitelist(signer.address);
            await spaceCoin.connect(signer).invest({
              value: ONE_ETHER.mul(1_500),
            });
            const invested = await spaceCoin.invested(signer.address);
            if (!invested.eq(ONE_ETHER.mul(7_500))) {
              throw new Error("Expected 7_500 tokens invested");
            }
          }
        });

        it("should block all investments if the fundraising is paused", async () => {
          await spaceCoin.connect(alice).togglePaused(true);
          const isPaused = await spaceCoin.isPaused();
          if (!isPaused) {
            throw new Error("Expected paused");
          }
          for (const investor of investors) {
            await expect(
              spaceCoin.connect(investor).invest({
                value: 1,
              })
            ).to.be.revertedWith("paused");
          }
        });

        it("should block all investments even if the fundraising is not paused", async () => {
          for (const investor of investors) {
            await expect(
              spaceCoin.connect(investor).invest({
                value: 1,
              })
            ).to.be.revertedWith("above personal limit");
          }
        });
      });
    });

    describe("Phase: General", () => {
      let spaceCoin: SpaceCoin;
      describe("Below limits", () => {
        let edgeCaseBuilder: GeneralPhaseEdgeCaseBuilder;

        beforeEach(async () => {
          const seedBuiler = await helper.getSeedPhaseEdgeCase();
          edgeCaseBuilder = await seedBuiler.advance();
          spaceCoin = edgeCaseBuilder.spaceCoin;
        });

        it("should block anyone from claiming the ERC-20 tokens", async () => {
          for (const investor of edgeCaseBuilder.allInvestors) {
            await expect(
              spaceCoin.connect(investor).claimTokens(1, investor.address)
            ).to.be.revertedWith("wrong phase");
          }
        });

        it("should block all investments if the fundraising is paused", async () => {
          await spaceCoin.connect(alice).togglePaused(true);
          const isPaused = await spaceCoin.isPaused();
          if (!isPaused) {
            throw new Error("expected is paused");
          }
          for (const investor of edgeCaseBuilder.canStillInvest) {
            await expect(
              spaceCoin.connect(investor).invest({
                value: 1,
              })
            ).to.be.revertedWith("paused");
          }
        });

        it("should block investments if personal total >= 1_000 ETH", async () => {
          for (const investor of edgeCaseBuilder.cantInvestAnymore) {
            const invested = await spaceCoin.invested(investor.address);
            if (invested.lt(ONE_ETHER.mul(5_000))) {
              throw new Error("Expected at least 5_000 tokens investment");
            }
            await expect(
              spaceCoin.connect(investor).invest({
                value: 1,
              })
            ).to.be.revertedWith("above personal limit");
          }
        });

        it("should allow all addresses to invest (whitelisted and otherwise) if personal total < 1_000 AND cumulative total < 30_000", async () => {
          for (const investor of edgeCaseBuilder.canStillInvest) {
            const invested = await spaceCoin.invested(investor.address);
            if (invested.gte(ONE_ETHER.mul(5_000))) {
              throw new Error("Expected less than 5_000 tokens investment");
            }
            const remaining = ONE_ETHER.mul(5_000).sub(invested).div(5);
            if (remaining.lte(0)) {
              throw new Error("Expected above-zero space left for investment");
            }
            await spaceCoin.connect(investor).invest({
              value: remaining,
            });
            const finalTotalInvested = await spaceCoin.invested(
              investor.address
            );
            expect(finalTotalInvested).to.equal(ONE_ETHER.mul(5_000));
          }
        });
      });

      describe("Above limits", () => {
        it("should block investments if cumulative total >= 30_000 ETH", async () => {
          const firstInvestors = helper.signers.others.slice(0, 30);
          const secondInvestors = helper.signers.others.slice(30, 40);
          if (firstInvestors.length !== 30) {
            throw new Error("Expected 30 investors");
          }
          if (secondInvestors.length !== 10) {
            throw new Error("Expected 10 investors");
          }
          const tokenContract = await helper.spaceCoinFactory
            .connect(alice)
            .deploy(treasury1.address);
          await tokenContract.connect(alice).advancePhaseFrom(Phase.SEED);
          const currentPhase = await tokenContract.currentPhase();
          if (currentPhase !== Phase.GENERAL) {
            throw new Error("Expected current phase to be General");
          }
          for (const investor of firstInvestors) {
            await tokenContract.connect(alice).addToWhitelist(investor.address);
            await tokenContract.connect(investor).invest({
              value: ONE_ETHER.mul(1_000),
            });
          }
          const balance = await ethers.provider.getBalance(
            tokenContract.address
          );
          if (!balance.eq(ONE_ETHER.mul(30_000))) {
            throw new Error("Expected 30_000 ETH balance");
          }
          for (const investor of secondInvestors) {
            await expect(
              tokenContract.connect(investor).invest({
                value: 1,
              })
            ).to.be.revertedWith("above total limit");
          }
        });

        it("should emit a ReachedTotalPhaseLimit event when the total investments reach 30,000 ETH", async () => {
          const firstInvestors = helper.signers.others.slice(0, 29);
          const lastInvestor = helper.signers.others[29];
          if (firstInvestors.length !== 29) {
            throw new Error("Expected 29 investors");
          }
          const tokenContract = await helper.spaceCoinFactory
            .connect(alice)
            .deploy(treasury1.address);
          await tokenContract.connect(alice).advancePhaseFrom(Phase.SEED);
          const currentPhase = await tokenContract.currentPhase();
          if (currentPhase !== Phase.GENERAL) {
            throw new Error("Expected current phase to be General");
          }
          for (const investor of firstInvestors) {
            await tokenContract.connect(alice).addToWhitelist(investor.address);
            await tokenContract.connect(investor).invest({
              value: ONE_ETHER.mul(1_000),
            });
          }
          const balance = await ethers.provider.getBalance(
            tokenContract.address
          );
          if (!balance.eq(ONE_ETHER.mul(29_000))) {
            throw new Error("Expected 29_000 ETH balance");
          }
          await expect(
            tokenContract.connect(lastInvestor).invest({
              value: ONE_ETHER.mul(1_000),
            })
          )
            .to.emit(tokenContract, "ReachedTotalPhaseLimit")
            .withArgs(Phase.GENERAL, lastInvestor.address);
        });

        it("should emit a ReachedPersonalLimit event when the personal investments reach 1,000 ETH", async () => {
          const tokenContract = await helper.spaceCoinFactory
            .connect(alice)
            .deploy(treasury1.address);
          const investors = helper.signers.others.slice(0, 30);
          if (investors.length !== 30) {
            throw new Error("Expected 30 investors");
          }
          await tokenContract.connect(alice).advancePhaseFrom(Phase.SEED);
          const currentPhase = await tokenContract.currentPhase();
          if (currentPhase !== Phase.GENERAL) {
            throw new Error("Expected current phase to be General");
          }
          for (const investor of investors) {
            await expect(
              tokenContract.connect(investor).invest({
                value: ONE_ETHER.mul(1_000),
              })
            )
              .to.emit(tokenContract, "ReachedPersonalLimit")
              .withArgs(Phase.GENERAL, investor.address);
          }
        });
      });
    });

    describe("Phase: Open", () => {
      let spaceCoin: SpaceCoin;
      describe("Below limits", () => {
        let edgeCaseBuilder: OpenPhaseEdgeCaseBuilder;

        beforeEach(async () => {
          const seedBuiler = await helper.getSeedPhaseEdgeCase();
          const generalBuilder = await seedBuiler.advance();
          edgeCaseBuilder = await generalBuilder.advance();
          spaceCoin = edgeCaseBuilder.spaceCoin;
        });

        it("should block all investments if the fundraising is paused", async () => {
          await spaceCoin.connect(alice).togglePaused(true);
          const isPaused = await spaceCoin.isPaused();
          if (!isPaused) {
            throw new Error("expected paused");
          }
          for (const investor of edgeCaseBuilder.allInvestors) {
            await expect(
              spaceCoin.connect(investor).invest({
                value: 1,
              })
            ).to.be.revertedWith("paused");
          }
        });

        it("should allow all addresses to invest (whitelisted and otherwise) regardless of their personal totals, if total minted < 500,000", async () => {
          for (const investor of edgeCaseBuilder.allInvestors) {
            const investedBefore = await spaceCoin.invested(investor.address);
            await spaceCoin.connect(investor).invest({
              value: ONE_ETHER,
            });
            const investedAfter = await spaceCoin.invested(investor.address);
            expect(investedAfter.sub(investedBefore)).to.equal(
              ONE_ETHER.mul(5)
            );
          }
        });
      });

      describe("above limits", () => {
        beforeEach(async () => {
          spaceCoin = await helper.spaceCoinFactory
            .connect(alice)
            .deploy(treasury1.address);
          await spaceCoin.connect(alice).advancePhaseFrom(Phase.SEED);
          await spaceCoin.connect(alice).advancePhaseFrom(Phase.GENERAL);
        });

        it("should block investments if total minted >= 500,000", async () => {
          const investorOne = helper.signers.others[38];
          const investorTwo = helper.signers.others[39];

          await spaceCoin.connect(investorOne).invest({
            value: ONE_ETHER.mul(100_000),
          });

          await expect(
            spaceCoin.connect(investorTwo).invest({
              value: 1,
            })
          ).to.be.revertedWith("above total limit");
        });

        it("should emit a ReachedTotalPhaseLimit event if the supply hits 500_000", async () => {
          const investorOne = helper.signers.others[38];

          await expect(
            spaceCoin.connect(investorOne).invest({
              value: ONE_ETHER.mul(100_000),
            })
          )
            .to.emit(spaceCoin, "ReachedTotalPhaseLimit")
            .withArgs(Phase.OPEN, investorOne.address);
        });
      });
    });
  });
});
