import type { Telegraf } from "telegraf";
import { isValidClmm } from "@raliqbot/lib";
import type { ApiV3PoolInfoConcentratedItem } from "@raydium-io/raydium-sdk-v2";

import { createPositionSceneId } from "../scenes/create-position-scene";

const commandFilter = /^createPosition(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;

export const createPositionAction = (telegraf: Telegraf) => {
  telegraf.action(commandFilter, async (context) => {
    const callbackQuery = context.callbackQuery;
    if (callbackQuery && "data" in callbackQuery) {
      const [, ...poolIds] = callbackQuery.data.split(/-/g);
      const poolId = poolIds.join("-");
      if (!context.session.createPosition.info) {
        const pools = await context.raydium.api.fetchPoolById({ ids: poolId });
        for (const pool of pools) {
          if (isValidClmm(pool.programId)) {
            context.session.createPosition = {
              ...context.session.createPosition,
              info: pool as ApiV3PoolInfoConcentratedItem,
            };
            break;
          }
        }
      }

      return context.scene.enter(createPositionSceneId);
    }
  });
};
