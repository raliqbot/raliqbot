import { format } from "@raliqbot/shared";
import { harvestRewards, parseRewardSignatures } from "@raliqbot/lib";
import { Input, type Context, type Telegraf } from "telegraf";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";

import { db } from "../../instances";
import { atomic } from "../utils/atomic";
import { privateFunc, readFileSync } from "../utils";
import { createClaims } from "../../controllers/claims.controller";

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

      const signatures = await harvestRewards(
        context.raydium,
        CLMM_PROGRAM_ID,
        positions
      );

      if (signatures.length > 0) {
        await context.replyWithAnimation(
          Input.fromLocalFile("assets/reward.gif"),
          {
            caption: readFileSync(
              "locale/en/claim-reward/claim-reward-detail.md",
              "utf-8"
            ).replace(
              "%list%",
              signatures
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

        const tokenBalances = await parseRewardSignatures(
          context.raydium,
          ...signatures
        );
        const claims = tokenBalances.map((tokenBalances, index) => {
          const position = positions[index];
          const signature = signatures[index];

          return {
            signature,
            position: position.nftMint.toBase58(),
            metadata: { tokenBalances },
          };
        });

        return createClaims(db, ...claims);
      } else
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
