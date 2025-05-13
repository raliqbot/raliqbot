import "dotenv/config"
import moment from "moment";
import { test } from "bun:test";
import { BitQuery } from ".";

test("", async () => {
    console.log(process.env.APP_BITQUERY_API_KEY)
  const bitquery = new BitQuery(process.env.APP_BITQUERY_API_KEY!);
  const data = await bitquery.price.getAvgPriceWithTime({
    baseToken: "So11111111111111111111111111111111111111112",
    quoteToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    poolId: "8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj",
    time: moment().subtract(24, "hours").toISOString(),
  });

  console.log(JSON.stringify(data.data));
});
