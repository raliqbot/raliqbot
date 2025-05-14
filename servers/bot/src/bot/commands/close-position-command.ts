import { format } from "@raliqbot/shared";
import { Context, Telegraf } from "telegraf";
import { closePosition } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";

import { catchBotRuntimeError, privateFunc, readFileSync } from "../utils";

const commandFilter = /^close_position(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;

export const closePositionCommand = (telegraf: Telegraf) => {
  const onClosePosition = privateFunc(
    catchBotRuntimeError(async (context: Context) => {
      const text =
        context.message && "text" in context.message
          ? context.message.text
          : context.callbackQuery && "data" in context.callbackQuery
          ? context.callbackQuery.data
          : undefined;

      if (text) {
        const [, ...addresses] = text.split(/\s|-/g);

        let positions = await context.raydium.clmm.getOwnerPositionInfo({
          programId: CLMM_PROGRAM_ID,
        });

        positions = positions.filter((position) =>
          addresses
            .map((address) => address.toLowerCase())
            .find(
              (address) =>
                address === position.nftMint.toBase58().toLowerCase() ||
                address === position.poolId.toBase58().toLowerCase()
            )
        );

        const signatures = await closePosition(
          context.raydium,
          CLMM_PROGRAM_ID,
          positions
        );
        if (signatures)
          return Promise.all([
            context.replyWithMarkdownV2(
              readFileSync(
                "locale/en/close-position/position-closed.md",
                "utf-8"
              ).replace(
                "%list%",
                signatures
                  .map((signature, index) =>
                    format(
                      "[Transaction %](%)",
                      index + 1,
                      format("https://solscan.io/tx/%", signature)
                    )
                  )
                  .join(" | ")
              ),
              {
                link_preview_options: {
                  is_disabled: true,
                },
              }
            ),
            context.deleteMessage(),
          ]);
      }

      return context.replyWithMarkdownV2(
        readFileSync(
          "locale/en/close-position/position-id-required.md",
          "utf-8"
        )
      );
    })
  );

  telegraf.action(commandFilter, onClosePosition);
  telegraf.command(commandFilter, onClosePosition);
};

closePositionCommand.commandName = "close_position";
closePositionCommand.help = "Close position. Required position Id.";
