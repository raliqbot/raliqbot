import { web3 } from "@coral-xyz/anchor";

const stableMints = [
  new web3.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  new web3.PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
  new web3.PublicKey("USDrbBQwQbQ2oWHUPfA8QBHcyVxKUq1xHyXsSLKdUq2"),
  new web3.PublicKey("USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX"),
  new web3.PublicKey("USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA"),
  new web3.PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo"),
];

export const isStableCoin = (mint: string | web3.PublicKey) => {
  const stableMint = new web3.PublicKey(mint);
  return stableMints.some((mint) => mint.equals(stableMint));
};
