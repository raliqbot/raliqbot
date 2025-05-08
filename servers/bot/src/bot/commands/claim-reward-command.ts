import { format } from "@raliqbot/shared";
import type { Context, Telegraf } from "telegraf";
import { getPortfolio, harvestRewards } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";

import { catchBotRuntimeError, readFileSync } from "../utils";

export const claimRewardCommand = (telegraf: Telegraf) => {
  const onClaimReward = catchBotRuntimeError(async (context: Context) => {
    const text =
      context.message && "text" in context.message
        ? context.message.text
        : context.callbackQuery && "data" in context.callbackQuery
        ? context.callbackQuery.data
        : undefined;

    let positions = await context.raydium.clmm.getOwnerPositionInfo({
      programId: CLMM_PROGRAM_ID,
    });

    if (text) {
      let [, ...addresses] = text.split(/\s+|-|,/g);
      positions = positions.filter((position) =>
        addresses
          .map((address) => address.toLocaleLowerCase())
          .find(
            (address) =>
              position.nftMint.toBase58().toLowerCase() === address ||
              position.poolId.toBase58().toLowerCase() === address
          )
      );
    }

    const porfolio = await getPortfolio(
      context.raydium,
      CLMM_PROGRAM_ID,
      positions
    );
    const txIds = await harvestRewards(context.raydium, porfolio);

    if (txIds)
      return context.replyWithMarkdownV2(
        readFileSync(
          "locale/en/claim-reward/claim-reward-detail.md",
          "utf-8"
        ).replace(
          "%list%",
          txIds
            .map((txId, index) =>
              format(
                "[Transaction %](%)",
                index + 1,
                format("https://solscan.io/tx/%", txId)
              )
            )
            .join(" | ")
        ),
        { link_preview_options: { is_disabled: true } }
      );
    else
      return context.replyWithMarkdownV2(
        readFileSync("locale/en/claim-reward/no-reward.md", "utf-8")
      );
  });

  const commandFilter = /^claim_rewards(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;

  telegraf.action(commandFilter, onClaimReward);
  telegraf.command(commandFilter, onClaimReward);
};

claimRewardCommand.commandName = "claim_rewards";
claimRewardCommand.help =
  "Claim position rewards. Accepts optional position Id as parameter.";
