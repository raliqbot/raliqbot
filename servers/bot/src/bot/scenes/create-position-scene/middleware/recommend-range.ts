import moment from "moment";
import { XiorError } from "xior";
import type { Context } from "telegraf";

import { bitquery } from "../../../../instances";
import { recommendRange as _recommendRange } from "@raliqbot/lib";

export const recommendRange = async (
  context: Context,
  next: () => Promise<unknown>
) => {
  const { info, range } = context.session.createPosition;
  if (info && range.some((range) => range === 0.15)) {
    const response = await bitquery.price
      .getAvgPriceWithTime({
        poolId: info.id,
        baseToken: info.mintA.address,
        quoteToken: info.mintB.address,
        time: moment().subtract(24, "hours").toISOString(),
      })
      .then(({ data }) => data.data)
      .catch((error) => {
        if (error instanceof XiorError)
          console.error(
            "[xior.httpError] status=",
            error.response?.status,
            "response=",
            error.response?.data
          );
        return null;
      });

    if (response) {
      const {
        Solana: {
          DEXTradeByTokens: [{ Price }],
        },
      } = response;

      const priceIncrement = info.price - Price;
      context.session.createPosition.range = _recommendRange(
        info.config.defaultRangePoint,
        priceIncrement / Price
      );
    } else
      context.session.createPosition.range = _recommendRange(
        info.config.defaultRangePoint,
        info.config.defaultRange
      );
  }

  return next();
};
