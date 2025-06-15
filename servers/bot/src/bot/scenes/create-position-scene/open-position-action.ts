import assert from "assert";
import { format } from "@raliqbot/shared";
import { type Context, Markup } from "telegraf";
import { NATIVE_MINT } from "@solana/spl-token";
import { create_position } from "@raliqbot/lib";

import { Explorer } from "../../../utils";
import { cleanText, readFileSync } from "../../utils";
import { db, meteora } from "../../../instances";
import { getPool } from "../../../utils/cache";
import {
  createPositions,
  updatePositionById,
} from "../../../controllers/positions.controller";

export const openPositionAction = async (context: Context) => {
  const { amount, strategy, poolId, rangeIntervals, ratio } =
    context.scene.session.createPosition;
  assert(poolId && strategy && amount && rangeIntervals);
  const pool = await getPool(context, poolId);

  const { position, execute } = await create_position({
    pool,
    ratio,
    rangeIntervals,
    client: meteora,
    connection: context.connection,
    slippage: context.user.settings.data.slippage,
    input: {
      amount,
      mint: NATIVE_MINT,
    },
    owner: context.wallet,
    strategyType: strategy,
  });

  const [dbPosition] = await createPositions(db, {
    algorithm: "spot",
    pool: pool.pubkey.toBase58(),
    wallet: context.user.wallet.id,
    id: position.publicKey.toBase58(),
    metadata: {
      amount,
      strategy,
      rangeIntervals,
      ratio: ratio ? { a: ratio?.a, b: ratio?.b } : null,
    },
  });

  const signature = await execute({
    skipPreflight: false,
    commitment: "singleGossip",
  });

  return Promise.all([
    updatePositionById(db, dbPosition.id, { signature }),
    context.scene.leave(),
    context.replyWithMarkdownV2(
      readFileSync(
        context,
        "intl/locale/create-position/position-created.md"
      ).replace("%position%", cleanText(dbPosition.id)),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "❌ Close Position",
            format("closePosition-%", dbPosition.id)
          ),
        ],
        [
          Markup.button.url(
            "🔗 Open in Explorer",
            Explorer.buildTxURL(signature)
          ),
        ],
      ])
    ),
  ]);
};
