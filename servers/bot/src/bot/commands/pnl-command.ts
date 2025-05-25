import { Context, Input, Telegraf } from "telegraf";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";

import { privateFunc } from "../utils";
import { atomic } from "../utils/atomic";
import { buildMediaURL } from "../../core";
import { db, dexscreemer } from "../../instances";
import { getPosiitionsOrCachedPositions } from "../../utils/cache";
import { getPositionById } from "../../controllers/positions.controller";

export const pnlCommand = (telegraf: Telegraf) => {
  const onPNL = privateFunc(
    atomic(async (context: Context) => {
      const text =
        context.message && "text" in context.message
          ? context.message.text
          : context.callbackQuery && "data" in context.callbackQuery
          ? context.callbackQuery.data
          : undefined;

      if (!text) return;

      const [, ...addresses] = text.split(/\s+|,|-/g);
      const positions = await getPosiitionsOrCachedPositions(
        context,
        dexscreemer,
        CLMM_PROGRAM_ID,
        ...addresses
      );

      return Promise.all(
        positions.map(async (position) => {
          const cachedPosition = await getPositionById(db, position.nftMint);

          return context.replyWithPhoto(
            Input.fromURLStream(
              buildMediaURL("prefetched/pnl/", {
                data: JSON.stringify({
                  cachedPosition: {
                    createdAt: cachedPosition?.createdAt || new Date(),
                  },
                  rewardToken: {
                    reward: position.rewardToken.reward,
                    rewardInUSD: position.rewardToken.rewardInUSD,
                    mint: {
                      name: position.rewardToken.mint.name,
                      symbol: position.rewardToken.mint.symbol,
                      logoURI: position.rewardToken.mint.logoURI,
                    },
                  },
                  tokenA: {
                    amountInUSD: position.tokenA.amountInUSD,
                    rewardInUSD: position.tokenA.rewardInUSD,
                    mint: {
                      name: position.tokenA.mint.name,
                      symbol: position.tokenA.mint.symbol,
                      logoURI: position.tokenA.mint.logoURI,
                    },
                  },
                  tokenB: {
                    amountInUSD: position.tokenB.amountInUSD,
                    rewardInUSD: position.tokenB.rewardInUSD,
                    mint: {
                      name: position.tokenB.mint.name,
                      symbol: position.tokenB.mint.symbol,
                      logoURI: position.tokenB.mint.logoURI,
                    },
                  },
                }),
              })
            )
          );
        })
      );
    })
  );

  const commandFilter = /^pnl(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;
  telegraf.action(commandFilter, onPNL);
  telegraf.command(commandFilter, onPNL);
};

pnlCommand.commandName = "pnl";
pnlCommand.description = "Get PnL for a position. Position ID is optional.";
