import { isValidAddress } from "@raliqbot/lib";
import { PoolFetchType } from "@raydium-io/raydium-sdk-v2";
import { Composer, type Context, Markup, Scenes } from "telegraf";

import { format } from "../../core";
import { atomic } from "../utils/atomic";
import tokenList from "../../token_list.json";
import { cleanText, readFileSync } from "../utils";
import { onOpenPosition } from "../commands/open-position-command";
import { onCreatePosition } from "../actions/create-position-action";

const onAddress = atomic(async (context: Context) => {
  let address =
    context.message && "text" in context.message
      ? context.message.text
      : context.session.openPosition.address;

  if (address) {
    if (!isValidAddress(address)) {
      address = tokenList.mintList.find(
        (token) =>
          token.symbol.toLowerCase() === address?.toLowerCase() ||
          token.name.toLowerCase() === address?.toLowerCase()
      )?.address;
    }
  }

  if (
    context.message &&
    "text" in context.message &&
    address &&
    isValidAddress(address)
  ) {
    context.message.text = format("open-%", address);
    await onOpenPosition(context);
    return context.scene.leave();
  } else if (
    context.message &&
    "text" in context.message &&
    context.message.text
  ) {
    if (/open/.test(context.message.text)) {
      await onOpenPosition(context);
      return context.scene.leave();
    }
    if (/createPosition/.test(context.message.text)) {
      await onCreatePosition(context);
      return context.scene.leave();
    }
  }
});

export const onTrending = atomic(async (context: Context) => {
  const message =
    context.message && "text" in context.message
      ? context.message.text
      : context.callbackQuery && "data" in context.callbackQuery
      ? context.callbackQuery.data
      : undefined;

  if (message) {
    const [, page] = message.split(/-/g);
    let refinedPage = Number(page);
    refinedPage = Number.isNaN(refinedPage) ? 1 : refinedPage;

    const poolInfos = await context.raydium.api
      .getPoolList({
        sort: "fee24h",
        page: refinedPage,
        type: PoolFetchType.Concentrated,
        pageSize: 5,
      })
      .then((poolInfos) => ({
        ...poolInfos,
        data: poolInfos.data.filter(
          (data) => data.mintA.symbol && data.mintB.symbol
        ),
      }));

    if (poolInfos.data.length > 0) {
      const buttons = [];

      if (refinedPage > 1)
        buttons.push(
          Markup.button.callback(
            "⬅️ Previous",
            format("trending-%", refinedPage - 1)
          )
        );

      if (poolInfos.hasNextPage)
        buttons.push(
          Markup.button.callback(
            "Next ➡️",
            format("trending-%", refinedPage + 1)
          )
        );

      const message = readFileSync(
        "locale/en/trending/trending-token.md",
        "utf-8"
      )
        .replace("%page%", refinedPage.toString())
        .replace("%page_count%", poolInfos.count.toString())
        .replace(
          "%list%",
          poolInfos.data
            .map((poolInfo, index) => {
              context.session.cachedPoolInfos[poolInfo.id] = [poolInfo];

              return readFileSync(
                "locale/en/trending/trending-token-detail.md",
                "utf-8"
              )
                .replace(
                  "%index%",
                  (index + 1 + (refinedPage - 1) * 5).toString()
                )
                .replace(
                  "%name%",
                  cleanText(
                    format("%/%", poolInfo.mintA.symbol, poolInfo.mintB.symbol)
                  )
                )
                .replace(
                  "%link%",
                  format(
                    "https://t.me/%?start=%",
                    context.botInfo.username,
                    format("open-%", poolInfo.id)
                  )
                )
                .replace(
                  "%current_price%",
                  cleanText(poolInfo.price.toFixed(2))
                )
                .replace(
                  "%fees%",
                  cleanText((poolInfo.feeRate * 100).toString())
                )
                .replace(
                  "%liquidity%",
                  cleanText(poolInfo.tvl.toLocaleString())
                )
                .replace(
                  "%volume%",
                  cleanText(poolInfo.day.volume.toLocaleString())
                )
                .replace(
                  "%fees_24h%",
                  cleanText(poolInfo.day.volumeFee.toLocaleString())
                )
                .replace("%apr%", cleanText(poolInfo.day.apr.toFixed(2)));
            })
            .join("\n")
        );

      const reply_markup = Markup.inlineKeyboard([
        buttons,
        [Markup.button.callback("🔁 Refresh", "trending-1")],
        [Markup.button.callback("🅇 Cancel", "cancel")],
      ]).reply_markup;

      await (context.callbackQuery && Number.isInteger(parseFloat(page))
        ? context.editMessageText(message, {
            reply_markup,
            link_preview_options: { is_disabled: true },
            parse_mode: "MarkdownV2",
          })
        : context.replyWithMarkdownV2(message, {
            reply_markup,
            link_preview_options: {
              is_disabled: true,
            },
          }));
    }
  }
});

const cancelCommandFilter = /cancel/;
const trendingCommandFilter = /trending(-\d+)?/;

const composer = new Composer();
composer.on("message", onAddress);
composer.action(trendingCommandFilter, onTrending);
composer.action(cancelCommandFilter, async (context) => {
  await context.deleteMessage();
  return context.scene.leave();
});

export const openPositionSceneId = "open-position-scene-id";
export const openPositionScene = new Scenes.WizardScene(
  openPositionSceneId,
  async (context) => {
    if (context.session.openPosition && context.session.openPosition.address)
      return onAddress(context);
    else await onTrending(context);

    return context.wizard.next();
  },
  composer
);
