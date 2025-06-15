import { Markup, type Context, type Telegraf } from "telegraf";
import { close_position, is_valid_address } from "@raliqbot/lib";
import { sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

import { Explorer, getPoolWithPositions } from "../../utils";

export const closePositionCommand = (bot: Telegraf) => {
  const onClosePositionCommand = async (context: Context) => {
    const text =
      context.callbackQuery && "data" in context.callbackQuery
        ? context.callbackQuery.data
        : context.message && "text" in context.message
        ? context.message.text
        : undefined;

    if (text) {
      let [, ...positions] = text.split(/\s/g);
      positions = positions.filter(is_valid_address);

      if (positions.length > 0) {
        const transactions = new Transaction();
        const poolWithPositions = await getPoolWithPositions(
          context,
          ...positions
        );
        if (poolWithPositions.length > 0) {
          for (const { pool, positions } of poolWithPositions) {
            const { transaction } = await close_position(
              context.connection,
              pool,
              context.wallet,
              positions
            );

            transactions.add(transaction);
          }
        }

        const signature = await sendAndConfirmTransaction(
          context.connection,
          transactions,
          [context.wallet],
          { commitment: "singleGossip" }
        );

        return context.replyWithMarkdownV2(
          "",
          Markup.inlineKeyboard([
            Markup.button.url(
              "View Transaction",
              Explorer.buildTxURL(signature)
            ),
          ])
        );
      }
    }
  };

  const commandFilter = /closePosition/;

  bot.action(commandFilter, onClosePositionCommand);
  bot.command(commandFilter, onClosePositionCommand);
};

closePositionCommand.command = "closePosition";
closePositionCommand.description =
  "Close a single position or multiple positions. /help closePosition for detailed help.";
