import { format } from "@raliqbot/shared";
import { Context, Markup, Telegraf } from "telegraf";
import { closePosition } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";

import { isValidAddress, readFileSync } from "../utils";

const commandFilter = /^close(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;

export const closePositionCommand = (telegraf: Telegraf) => {
  const onClosePosition = async (context: Context) => {
    const message =
      context.message && "text" in context.message
        ? context.message.text.split(/\s/g)
        : context.callbackQuery && "data" in context.callbackQuery
        ? context.callbackQuery.data.split(/-/)
        : undefined;
    if (message) {
      const [, positionId] = message;

      if (positionId && isValidAddress(positionId)) {
        const positions = await context.raydium.clmm.getOwnerPositionInfo({
          programId: CLMM_PROGRAM_ID,
        });

        [context.session.closePosition.position] = positions.filter(
          (position) => position.nftMint.toBase58() === positionId
        );
      }

      if (context.session.closePosition.position) {
        const signature = await closePosition(
          context.raydium,
          context.session.closePosition.position
        );

        return context.replyWithMarkdownV2(
          readFileSync("locale/en/close-position/position-closed.md"),
          Markup.inlineKeyboard([
            [
              Markup.button.url(
                "View in Explorer",
                format("%%", "https://solscan.io/tx/%/", signature)
              ),
            ],
          ])
        );
      }

      return context.replyWithMarkdownV2(
        readFileSync(
          "locale/en/close-position/position-id-required.md",
          "utf-8"
        )
      );
    }
  };

  telegraf.command(commandFilter, onClosePosition);
  telegraf.action(commandFilter, onClosePosition);
};
