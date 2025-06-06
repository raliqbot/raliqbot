import { web3 } from "@coral-xyz/anchor";

export const isValidAddress = (address: string) => {
  try {
    new web3.PublicKey(address);
    return true;
  } catch {
    return false;
  }
};
