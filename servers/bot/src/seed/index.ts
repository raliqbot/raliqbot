import { writeFileSync } from "fs";
import { web3 } from "@coral-xyz/anchor";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

export async function main() {
  const raydium = await Raydium.load({
    cluster: "mainnet",
    connection: new web3.Connection(web3.clusterApiUrl("mainnet-beta")),
  });

  const tokens = await raydium.api.getTokenList();

  writeFileSync("src/token_list.json", JSON.stringify(tokens, undefined, 2));
}


main()