import { type Context, Markup, type Telegraf } from "telegraf";
import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { claim_reward_by_position, is_valid_address } from "@raliqbot/lib";

import { getPoolWithPositions, Explorer } from "../../utils";

export const claimRewardCommand = (bot: Telegraf) => {
  const onClaimRewardCommand = async (context: Context) => {
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
            const { transaction } = await claim_reward_by_position(
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

  const commandFilter = /claimReward/;

  bot.action(commandFilter, onClaimRewardCommand);
  bot.command(commandFilter, onClaimRewardCommand);
};

claimRewardCommand.command = "claimReward";
claimRewardCommand.description =
  "Claim rewards for a single position or multiple positions. /help claimReward for detailed help.";
