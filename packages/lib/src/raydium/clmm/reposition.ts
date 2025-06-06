import Decimal from "decimal.js";
import type { Raydium } from "@raydium-io/raydium-sdk-v2";
import {
  closePosition,
  createPosition,
  getPositions,
  parseRewardSignatures,
} from "@raliqbot/lib";

export const reposition = async (
  raydium: Raydium,
  slippage: number,
  ...poolsWithPositions: Awaited<ReturnType<typeof getPositions>>
) => {
  console.log(
    "repositioning=",
    poolsWithPositions.length,
    "positions=",
    poolsWithPositions.flatMap(({ positions }) =>
      positions.map((position) => position.poolId.toBase58())
    )
  );

  const signatures = await closePosition(raydium, poolsWithPositions);
  console.log("close signatures=", signatures);

  if (signatures) {
    for (let index = 0; index < poolsWithPositions.length; index++) {
      const pool = poolsWithPositions[index].pool;
      const baseMint = pool.poolInfo.mintB;
      const balanceChange = await parseRewardSignatures(raydium, ...signatures);

      console.log("range=", [
        pool.poolInfo.config.defaultRange * 0.4,
        pool.poolInfo.config.defaultRange,
      ]);

      const [repositionSignatures] = await createPosition(raydium, {
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

      console.log("reposition signatures=", repositionSignatures);
      signatures.push(...repositionSignatures);
    }
  }

  return signatures;
};
