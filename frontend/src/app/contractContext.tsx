import { BigNumber, ethers, Signer } from "ethers";
import React, { useState, useEffect } from "react";
import SpaceCoinJSON from "../artifacts/contracts/SpaceCoin.sol/SpaceCoin.json";
import { type SpaceCoin } from "../../../typechain";

const ERRORS = {
  paused: "Fundraising is currently paused, and we can't investments for now.",
  "whitelist only": "Fundraising only allows whitelisted investors for now.",
  "above total limit": "The phase is oversubscribed. Cant invest for now.",
  "above personal limit":
    "You have reached your personal limit for this phase. Please wait until next phase to invest more.",
};

export const provider = new ethers.providers.Web3Provider(window.ethereum);
export const signer = provider.getSigner();

const contractAddress = "0xeF2f5c5316579a3AD12f7a8ec7B17B452Ea47d5F";
const contract = new ethers.Contract(
  contractAddress,
  SpaceCoinJSON.abi,
  provider
) as SpaceCoin;

console.log(contract);

export enum Phase {
  SEED,
  GENERAL,
  OPEN,
}

provider.on(
  {
    address: contractAddress,
    topics: [
      // the name of the event, parnetheses containing the data type of each event, no spaces
      ethers.utils.id("ToggledTax(bool to)"),
    ],
  },
  async () => {
    alert("TAX!");
  }
);

export type ContractState = {
  signer: string;
  owner: string;
  currentPhase: Phase;
  isPaused: boolean;
  isTaxed: boolean;
  entitledBalance: BigNumber;
  balance: BigNumber;
  isWhitelisted: boolean;
};

const ONE_ETHER = ethers.utils.parseEther("1");

const getDisplay = (tokens: BigNumber) => {
  const whole = tokens.div(ONE_ETHER);
  const remainder = tokens.mod(ONE_ETHER);
  return {
    whole,
    remainder,
  };
};

export const getRemoteContractState = async (): Promise<ContractState> => {
  const signerAddress = await signer.getAddress();
  return {
    signer: signerAddress,
    owner: await contract.connect(signer).owner(),
    currentPhase: await contract.connect(signer).currentPhase(),
    isPaused: await contract.connect(signer).isPaused(),
    isTaxed: await contract.connect(signer).isTaxed(),
    entitledBalance: await contract.connect(signer).invested(signerAddress),
    balance: await contract.connect(signer).balanceOf(signerAddress),
    isWhitelisted: await contract.connect(signer).whitelisted(signerAddress),
  };
};

const nullState = {
  signer: "",
  owner: "",
  currentPhase: Phase.SEED,
  isPaused: false,
  isTaxed: false,
  entitledBalance: BigNumber.from(0),
  balance: BigNumber.from(0),
  isWhitelisted: false,
};

export const ContractContext = React.createContext(nullState);

export const ContractContextWrapper = () => {
  const [contractState, setContractState] = useState<ContractState>(nullState);
  const [buying, setBuying] = useState("");
  const [isLoading, setLoading] = useState(true);
  const resetContractState = async () => {
    const remoteState = await getRemoteContractState();
    setContractState(remoteState);
  };

  useEffect(() => {
    resetContractState().then(() => {
      setLoading(false);
    });
  }, []);

  if (isLoading) {
    return <div>loading...</div>;
  }

  const entitled = getDisplay(contractState.entitledBalance);
  const actual = getDisplay(contractState.balance);

  return (
    <ContractContext.Provider value={contractState}>
      <table className="table-auto hover:table-fixed bg-gray-200 rounded">
        <tr>
          <td>Logged in as</td>
          <td>{contractState.signer}</td>
        </tr>
        <tr>
          <td>Contract Address</td>
          <td>{contractAddress}</td>
        </tr>
        <tr>
          <td>Owner</td>
          <td>{contractState.owner}</td>
        </tr>
        <tr>
          <td>Current Phase</td>
          <td>
            {(() => {
              switch (contractState.currentPhase) {
                case Phase.SEED:
                  return "Seed";
                case Phase.GENERAL:
                  return "General";
                default:
                  return "Open";
              }
            })()}
          </td>
        </tr>
        <tr>
          <td>Paused</td>
          <td>{contractState.isPaused ? "Yes" : "No"}</td>
        </tr>
        <tr>
          <td>Taxed</td>
          <td>{contractState.isTaxed ? "Yes" : "No"}</td>
        </tr>
        <tr>
          <td>Whitelisted</td>
          <td>{contractState.isWhitelisted ? "Yes" : "No"}</td>
        </tr>
        <tr>
          <td>Pre-Tax Entitled Balance</td>
          <td>{`${entitled.whole}.${entitled.remainder}`}</td>
        </tr>
        <tr>
          <td>Actual Balance</td>
          <td>{`${actual.whole}.${actual.remainder}`}</td>
        </tr>
      </table>

      <div className="mt-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            try {
              await contract.connect(signer).invest({
                value: ethers.utils.parseEther(buying).div(5),
              });
              setBuying("");
              await resetContractState();
              alert(
                "Purchase successful. Refresh the page in a few seconds to see the changes."
              );
            } catch (e) {
              try {
                console.log(e);
                const error = e.error.message.substr(20);
                const message = ERRORS[error];
                alert(message || error);
              } catch (e) {
                alert(
                  "Something went wrong. Check the console logs for more details."
                );
              }
            }
          }}
        >
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            type="number"
            value={buying}
            onChange={(e) => {
              setBuying(e.target.value);
            }}
          />
          <button
            type="submit"
            className="bg-blue-500 disabled:bg-gray-300 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={buying === ""}
          >
            Buy{" "}
            {`<${buying === "" ? 0 : Number.parseFloat(buying, 10) / 5} ETH>`}
          </button>
        </form>
      </div>
    </ContractContext.Provider>
  );
};

// export const refetchContractContext = async ({
//   signer,
//   contract,
// }: {
//   signer: Signer;
//   contract: SpaceCoin;
// }) => {
//   const state = await getContractState({ signer, contract });
//   contractContext.
// };
