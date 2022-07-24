import { BigNumber, ethers, Wallet } from "ethers";
import React from "react";

export const provider = new ethers.providers.Web3Provider(window.ethereum);
export const signer = provider.getSigner();

export const App = () => {
  return (
    <div>
      <button
        onClick={async () => {
          const signed = await signer._signTypedData(
            {
              name: "CollectorDAO",
              verifyingContract: await signer.getAddress(),
              version: "0.0.1",
            },
            {
              Ballot: [
                { name: "proposalId", type: "string" },
                { name: "vote", type: "uint8" },
              ],
            },
            {
              proposalId: "abc",
              vote: 4,
            }
          );
          console.log({ signed });
        }}
      >
        CLICK
      </button>
    </div>
  );
};
