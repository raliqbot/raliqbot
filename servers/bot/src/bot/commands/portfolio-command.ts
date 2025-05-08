import { format } from "@raliqbot/shared";
import { getPortfolio } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";
import { Input, Markup, type Context, type Telegraf } from "telegraf";

import { buildMediaURL } from "../../core";
import { cleanText, readFileSync } from "../utils";

export const portfolioCommand = (telegraf: Telegraf) => {
  const onPortfolio = async (context: Context) => {
    const text =
      context.message && "text" in context.message
        ? context.message.text
        : undefined;

    let porfolios = await getPortfolio(context.raydium, CLMM_PROGRAM_ID);

    if (porfolios.length > 0) {
      return Promise.all(
        porfolios.map(({ poolInfo: { poolInfo }, positions }) => {
          if (text) {
            const [, ...addresses] = text.split(/\s+/g);
            if (addresses.length > 0)
              positions = positions.filter((position) =>
                addresses.includes(position.nftMint.toBase58())
              );
          }

          return positions.map((position) => {
            const positionId = position.nftMint.toBase58();
            const name = format(
              "%/%",
              poolInfo.mintA.symbol,
              poolInfo.mintB.symbol
            );

            return context.replyWithPhoto(
              Input.fromURLStream(
                buildMediaURL(format("%/position", position.nftMint), {
                  owner: context.raydium.ownerPubKey.toBase58(),
                })
              ),
              {
                caption: readFileSync(
                  "locale/en/position/position-detail.md",
                  "utf-8"
                )
                  .replace("%position_id%", cleanText(positionId))
                  .replace("%name%", cleanText(name)),
                parse_mode: "MarkdownV2",
                reply_markup: Markup.inlineKeyboard([
                  [
                    Markup.button.callback(
                      "☘️ Generate PNL Card",
                      format("pnl-%", positionId)
                    ),
                  ],
                  [
                    Markup.button.callback(
                      "🎁 Claim Reward",
                      format("claim_rewards-%", positionId)
                    ),
                  ],
                  [
                    Markup.button.callback(
                      "🅇 Close Position",
                      format("close_position-%", positionId)
                    ),
                  ],
                ]).reply_markup,
              }
            );
          });
        })
      );
    } else
      return context.replyWithMarkdownV2(
        readFileSync("locale/en/porfolio/no-open-position.md", "utf-8")
      );
  };

  telegraf.action("portfolio", onPortfolio);
  telegraf.command("portfolio", onPortfolio);
};

portfolioCommand.commandName = "portfolio";
portfolioCommand.help =
  "Get your opened positions, include positionId to filter a particular position.";
