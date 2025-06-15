import { meteora } from "instances";
import { format } from "@raliqbot/shared";
import { message } from "telegraf/filters";
import { Composer, Markup, Scenes } from "telegraf";

import { cleanText, readFileSync } from "../utils";

export const searchPairSceneId = "search-pair-scene-id";

const composer = new Composer();
composer.action(/next/, () => {});
composer.action(/previous/, () => {});

export const searchPairScene = new Scenes.WizardScene(
  searchPairSceneId,
  async (context) => {
    const { pairs, total } = await meteora.pair.allWithPagination({ limit: 5 });

    if (total > 0) {
      return context.editMessageText(
        readFileSync(context, "intl/locale/pool/search-detail.md")
          .replace("%page%", "1")
          .replace(
            "%trending%",
            pairs
              .map((pair, index) =>
                readFileSync(context, "intl/locale/pool/pool-info.md")
                  .replace(
                    "%name%",
                    format(
                      "[\\/% %](https://t.me/%/?start=/createPosition %)",
                      index + 1,
                      cleanText(pair.name),
                      context.botInfo.username,
                      pair.address
                    )
                  )
                  .replace(
                    "%tvl%",
                    cleanText(Number(pair.liquidity).toLocaleString())
                  )
                  .replace("%bin_steps%", cleanText(String(pair.bin_step)))
                  .replace(
                    "%base_fee%",
                    cleanText(String(pair.base_fee_percentage))
                  )
                  .replace(
                    "%max_fee%",
                    cleanText(String(pair.max_fee_percentage))
                  )
                  .replace(
                    "%protocol_fee%",
                    cleanText(String(pair.protocol_fee_percentage))
                  )
                  .replace(
                    "%24h_vol%",
                    cleanText(pair.trade_volume_24h.toLocaleString())
                  )
                  .replace(
                    "%24h_fee%",
                    cleanText(pair.fees_24h.toLocaleString())
                  )
              )
              .join("\n")
          ),
        {
          parse_mode: "MarkdownV2",
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback("⏪ Previous", "previous"),
              Markup.button.callback("⏩ Next", "next"),
            ],
            [Markup.button.callback("🛠️ Main Menu", "mainmenu")],
          ]).reply_markup,
        }
      );
    }
  }
);

searchPairScene.on(message("text"), async (context) => {
  const text = context.message.text;
  context.session;
  const pairs = await meteora.pair.allWithPagination();
});
