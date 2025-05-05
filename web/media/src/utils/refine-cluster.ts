import { clusterApiUrl } from "@solana/web3.js";

export const refineCluster = (cluster: "devnet" | "mainnet") =>
  cluster ? (cluster === "mainnet" ? "mainnet-beta" : cluster) : "mainnet-beta";

export const getClusterURL = (cluster: "devnet" | "mainnet") => {
  const refinedCluster = refineCluster(cluster);

  return refinedCluster === "mainnet-beta"
    ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? clusterApiUrl(refinedCluster)
    : process.env.NEXT_PUBLIC_DEVNET_RPC_URL ?? clusterApiUrl(refinedCluster);
};
