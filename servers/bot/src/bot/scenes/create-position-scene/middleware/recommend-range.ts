import moment from "moment";
import { Context } from "telegraf";

import { bitquery } from "../../../../instances";

export const recommendRange = async (
  context: Context,
  next: () => Promise<unknown>
) => {
  const { info } = context.session.createPosition;
  if (info) {
    const response = await bitquery.price
      .getAvgPriceWithTime({
        poolId: info.id,
        baseToken: info.mintA.address,
        quoteToken: info.mintB.address,
        time: moment().subtract(24, "hours").toISOString(),
      })
      .then(({ data }) => data.data)
      .catch((error) => {
        console.error(error);
        return null;
      });

    if (response) {
      const {
        Solana: {
          DEXTradeByTokens: [{ Price }],
        },
      } = response;

      const priceIncrement = info.price - Price;
      const range = priceIncrement / Price;
      context.session.createPosition.range = [
        range > 0 ? range : Math.abs(range * 2),
        range > 0 ? range * 2 : Math.abs(range),
      ];
    }
  }

  return next();
};
