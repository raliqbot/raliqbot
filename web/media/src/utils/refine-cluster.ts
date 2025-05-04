export const refineCluser = (cluster: "devnet" | "mainnet") =>
  cluster ? (cluster === "mainnet" ? "mainnet-beta" : cluster) : "mainnet-beta";
