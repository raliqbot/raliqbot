import { format } from "@raliqbot/shared";
import { getPositions } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";
import { Input, Markup, type Context, type Telegraf } from "telegraf";

import { buildMediaURL } from "../../core";
import { cleanText, isValidAddress, readFileSync } from "../utils";

export const onPortfolio = (context: Context) => {
  const text =
    context.message && "text" in context.message
      ? context.message.text
      : context.callbackQuery && "data" in context.callbackQuery
      ? context.callbackQuery.data
      : undefined;

  if (text) {
    const [, positionId, ...name] = text.replace(/\/start/, "").split(/-/);

    if (isValidAddress(positionId)) {
      return context.replyWithPhoto(
        Input.fromURLStream(
          buildMediaURL(format("%/position", positionId), {
            owner: context.raydium.ownerPubKey.toBase58(),
          })
        ),
        {
          caption: readFileSync(
            "locale/en/position/position-detail.md",
            "utf-8"
          )
            .replace("%position_id%", cleanText(positionId))
            .replace("%name%", cleanText(name.join("-"))),
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
                "🅇 Close Position",
                format("close-%", positionId)
              ),
            ],
          ]).reply_markup,
        }
      );
    }
  }
};

export const portfolioCommand = (telegraf: Telegraf) => {
  const onPortfolio = async (context: Context) => {
    const porfolios = await getPositions(context.raydium, CLMM_PROGRAM_ID);
    const messages = [];

    if (porfolios.length > 0) {
      for (const {
        poolInfo: { poolInfo },
        positions,
      } of porfolios) {
        for (const position of positions) {
          const positionId = position.nftMint.toBase58();
          const name = format(
            "%/%",
            poolInfo.mintA.symbol,
            poolInfo.mintB.symbol
          );

          messages.push(
            context.replyWithPhoto(
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
                      "🅇 Close Position",
                      format("close-%", positionId)
                    ),
                  ],
                ]).reply_markup,
              }
            )
          );
        }
      }
    } else
      return context.replyWithMarkdownV2(
        readFileSync("locale/en/porfolio/no-open-position.md", "utf-8")
      );
  };

  telegraf.action("portfolio", onPortfolio);
  telegraf.command("portfolio", onPortfolio);
};
