import { format } from "@raliqbot/shared";
import { harvestRewards } from "@raliqbot/lib";
import { Input, type Context, type Telegraf } from "telegraf";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";

import { atomic } from "../utils/atomic";
import { privateFunc, readFileSync } from "../utils";

export const claimRewardCommand = (telegraf: Telegraf) => {
  const onClaimReward = privateFunc(
    atomic(async (context: Context) => {
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

      const txIds = await harvestRewards(
        context.raydium,
        CLMM_PROGRAM_ID,
        positions
      );

      if (txIds)
        return context.replyWithAnimation(
          Input.fromLocalFile("assets/reward.gif"),
          {
            caption: readFileSync(
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
            parse_mode: "MarkdownV2",
          }
        );
      else
        return context.replyWithMarkdownV2(
          readFileSync("locale/en/claim-reward/no-reward.md", "utf-8")
        );
    })
  );

  const commandFilter = /^claim_rewards(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;

  telegraf.action(commandFilter, onClaimReward);
  telegraf.command(commandFilter, onClaimReward);
};

claimRewardCommand.commandName = "claim_rewards";
claimRewardCommand.help =
  "Claim position rewards. Accepts optional position Id as parameter.";
