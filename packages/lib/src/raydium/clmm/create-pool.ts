import Decimal from "decimal.js";
import { web3 } from "@coral-xyz/anchor";
import { Raydium, TxVersion } from "@raydium-io/raydium-sdk-v2";

import { devConfigs } from "./utils";

export const createPool = async (
  raydium: Raydium,
  tokenA: string,
  tokenB: string,
  programId: web3.PublicKey
) => {
  const mint1 = await raydium.token.getTokenInfo(tokenA);
  const mint2 = await raydium.token.getTokenInfo(tokenB);

  const [clmmConfig] =
    raydium.cluster === "mainnet"
      ? await raydium.api.getClmmConfigs()
      : devConfigs;

  const { execute, extInfo } = await raydium.clmm.createPool({
    programId,
    mint1,
    mint2,
    ammConfig: {
      ...clmmConfig,
      id: new web3.PublicKey(clmmConfig.id),
      fundOwner: "",
      description: "RaliqBot Devnet Liquidity",
    },
    initialPrice: new Decimal(1),
    txVersion: TxVersion.LEGACY,
  });

  const { txId } = await execute({ sendAndConfirm: true });
  return [txId, extInfo.address.id];
};
