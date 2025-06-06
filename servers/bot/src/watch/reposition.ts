import Decimal from "decimal.js";
import type { Telegraf } from "telegraf";
import type { Raydium } from "@raydium-io/raydium-sdk-v2";
import {
  closePosition,
  createPosition,
  getPositions,
  parseRewardSignatures,
} from "@raliqbot/lib";

import type { Database } from "../db";

export const reposition = async (
  db: Database,
  bot: Telegraf,
  raydium: Raydium,
  slippage: number,
  ...positions: Awaited<ReturnType<typeof getPositions>>
) => {
  console.log(
    "repositioning=",
    positions.length,
    "positions=",
    positions.flatMap(({ positions }) =>
      positions.map((position) => position.poolId.toBase58())
    )
  );

  let signatures = await closePosition(raydium, positions);
  if (signatures) {
    for (let index = 0; index < signatures.length; index++) {
      const pool = positions[index].pool;
      const baseMint = pool.poolInfo.mintB;
      const balanceChange = await parseRewardSignatures(raydium, ...signatures);

      [signatures] = await createPosition(raydium, {
        poolId: pool.poolInfo.id,
        slippage,
        rangeBias: false,
        range: [
          pool.poolInfo.config.defaultRange * 0.4,
          pool.poolInfo.config.defaultRange,
        ],
        input: {
          mint: baseMint.address,
          amount: new Decimal(balanceChange[index][baseMint.address])
            .div(Math.pow(10, baseMint.decimals))
            .toNumber(),
        },
      });

      console.log("reposition signatures=", signatures);
    }
  }
};
