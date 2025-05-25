import { isValidClmm } from "@raliqbot/lib";
import type { Context, Telegraf } from "telegraf";
import type { ApiV3PoolInfoConcentratedItem } from "@raydium-io/raydium-sdk-v2";

import {
  createSingleSidedPositionSceneId,
  createSpotPositionSceneId,
} from "../scenes/create-position-scene";

export const onCreatePosition = async (context: Context) => {
  let text =
    context.callbackQuery && "data" in context.callbackQuery
      ? context.callbackQuery.data
      : context.message && "text" in context.message
      ? context.message.text
      : undefined;

  if (text) {
    const [, algorithm, ...poolIds] = text
      .replace(/\/start?(\s+)/, "")
      .split(/_/g);
    const poolId = poolIds.join(",");

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

    context.session.createPosition.algorithm =
      algorithm === "spot" ? "spot" : "single-sided";

    return context.scene.enter(
      algorithm === "spot"
        ? createSpotPositionSceneId
        : createSingleSidedPositionSceneId
    );
  }
};

export const createPositionAction = (telegraf: Telegraf) => {
  telegraf.action(
    /^createPosition_(s|spot)(?:_([1-9A-HJ-NP-Za-km-z]{32,44}))?$/,
    onCreatePosition
  );
};
