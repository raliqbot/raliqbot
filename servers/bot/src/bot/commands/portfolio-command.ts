import millify from "millify";
import { format } from "@raliqbot/shared";
import { getPortfolio } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";
import { type Context, type Telegraf } from "telegraf";

import { atomic } from "../utils/atomic";
import { dexscreener } from "../../instances";
import { cleanText, privateFunc, readFileSync } from "../utils";

export const portfolioCommand = (telegraf: Telegraf) => {
  const onPortfolio = privateFunc(
    atomic(async (context: Context) => {
      let porfolios = await getPortfolio(
        context.raydium,
        dexscreener,
        CLMM_PROGRAM_ID
      );

      if (porfolios.length > 0) {
        return context.replyWithMarkdownV2(
          porfolios
            .flatMap(({ pool: { price, poolInfo }, positions }, _index) =>
              positions.map((position, index) => {
                context.session.cachedPositions[position.nftMint] = {
                  ...position,
                  poolInfo,
                };

                return readFileSync(
                  "locale/en/portfolio/portfolio-detail.md",
                  "utf-8"
                )
                  .replace(
                    "%link%",
                    format(
                      "https://t.me/%?start=portfolioDetail-%",
                      context.botInfo.username,
                      position.nftMint
                    )
                  )
                  .replace("%index%", String(_index + 1 * (index + 1)))
                  .replace(
                    "%name%",
                    cleanText(
                      format(
                        "%/%",
                        poolInfo.mintA.symbol,
                        poolInfo.mintB.symbol
                      )
                    )
                  )
                  .replace(
                    "%fees%",
                    cleanText((poolInfo.feeRate * 100).toString())
                  )
                  .replace("%liquidity%", cleanText(millify(poolInfo.tvl)))
                  .replace(
                    "%current_price%",
                    cleanText(String(price.PriceInUSD))
                  )
                  .replace("%volume%", cleanText(millify(poolInfo.day.volume)))
                  .replace(
                    "%fees_24h%",
                    cleanText(millify(poolInfo.day.volumeFee))
                  )
                  .replace("%apr%", cleanText(millify(poolInfo.day.apr)))
                  .replace(
                    "%position%",
                    cleanText(
                      millify(
                        position.tokenA.amountInUSD +
                          position.tokenB.amountInUSD,
                        { precision: 2 }
                      )
                    )
                  )
                  .replace(
                    "%yield%",
                    cleanText(
                      millify(
                        position.tokenA.rewardInUSD +
                          position.tokenB.rewardInUSD +
                          position.rewardToken.rewardInUSD,
                        { precision: 4 }
                      )
                    )
                  );
              })
            )
            .join("\n"),
          { link_preview_options: { is_disabled: true } }
        );
      } else
        return context.answerCbQuery(
          readFileSync("locale/en/portfolio/no-open-position.md", "utf-8"),
          { show_alert: true }
        );
    })
  );

  telegraf.action("portfolio", onPortfolio);
  telegraf.command("portfolio", onPortfolio);
};

portfolioCommand.commandName = "portfolio";
portfolioCommand.help =
  "Get your opened positions, include positionId to filter a particular position.";
