# ICO

## Disclaimer

⚠️⚠️ This contract is not audited. Using it on production is strongly advised against. ⚠️⚠️

## Description

This is a multi-phasic ICO protocol for a tax-on-trade token, along with a reference frontend application to interact with it. Below are the project requirements:

- 500,000 max total supply
- A 2% tax on every transfer that gets put into a treasury account
- The project owner can turn the tax on or off.
- The ICO aims to raise 30,000 ETH with a ratio of 5 tokens to 1 ether.
- The project owner can pause and remove the fundraising.
- Initially, the fundraiser is in the `seed` stage, where only whitelisted investors are allowed to partake.
- Only the project owner can add investors to the whitelist.
- The seed phase limits collective total investments to `15_000 ETH` and individual investments to `1_500 ETH`.
- The project owner is allowed to move the contract phase from `SEED` to `GENERAL`.
- On the `GENERAL` phase, collective total investments go up to`30_000 ETH`, and individual limits to down to `1_000 ETH`.
- The project owner is allowed to move the contract phase from `GENERAL` to `OPEN`.
- On the `OPEN` phase, the individual contribution limit is removed.


## Instructions

- Run `npm install` to install all dependencies.
- Run `npx hardhat` test to run the test suite.
- From within the `frontend` directory, run `npm start` to start the frontend application.
- Go to `http://localhost:1234` on your browser to interact with the frontend.

## Design Discussion

### Prompt

The base requirements give contributors their SPC tokens immediately. How would you design your contract to vest the awarded tokens instead, i.e. award tokens to users over time, linearly?

### Answer

Since it's linear, the awarding mechanism can be expressed as `uint256 constant UNIT_REWARD` per `uint256 constant UNIT_TIME`. Once we get to the `open` phase, we can set a new contract property `uint256 tokenClaimsBeginAt` to `block.timestamp`. Whenever someone attempts to claim their tokens, we first check if they have invested enough. We can then compute the `uint256 timeDelta` via `block.timestamp - tokenClaimsBeginAt`. We can then calculate the theoretical maximum amount of tokens the sender is entitled to via `uint256 theoreticalMax = (timeDelta * UNIT_REWARD) / UNIT_TIME`. We would then need to depend on another new contract property `mapping(address => uint256) preTaxTotalAwarded` that we keep updating whenever someone legally claims their tokens. Using the mapping, we can find the difference between the sender's theoretical maximum and how much preTax tokens they have been awarded so far. If the requested amount is larger than this final value, we revert. Otherwise, we increment their total awards on `preTaxTotalAwarded`, and proceed with minting, taxing and maintaining the other usual state invariants.