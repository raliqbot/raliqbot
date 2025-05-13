import { ApiImpl } from "@raliqbot/shared";

import type { AvgPrice, Price } from "./models/price.model";
import type { Response } from "./models/response.model";

export class PriceApi extends ApiImpl {
  protected path: string = "eap";

  getAvgPriceWithTime(variables: {
    baseToken: string;
    quoteToken: string;
    poolId: string;
    time: string;
  }) {
    const query = `query AvgPriceWithToken(\n  $baseToken: String!\n  $quoteToken: String!\n  $poolId: String!\n  $time: DateTime!\n) {\n  Solana(dataset: realtime) {\n    DEXTradeByTokens(\n      where: {\n        Transaction: { Result: { Success: true } }\n        Trade: {\n          Currency: { MintAddress: { is: $baseToken } }\n          Side: { Currency: { MintAddress: { is: $quoteToken } } }\n          Market: { MarketAddress: { is: $poolId } }\n        }\n        Block: { Time: { since: $time } }\n      }\n    ) {\n      Price: average(\n        of: Trade_Price\n        if: {\n          Trade: { Side: { Type: { is: buy } } }\n          Block: { Time: { after: $time } }\n        }\n      )\n      PriceInUSD: average(\n        of: Trade_PriceInUSD\n        if: {\n          Trade: { Side: { Type: { is: buy } } }\n          Block: { Time: { after: $time } }\n        }\n      )\n    }\n  }\n}\n`;
    return this.xior.post<Response<AvgPrice>>(this.path, { query, variables });
  }

  getPairPrice(variables: {
    baseToken: string;
    quoteToken: string;
    poolId: string;
  }) {
    const query = `query PairPrice($baseToken: String!, $quoteToken: String!, $poolId: String) {\n  Solana(dataset: realtime) {\n    DEXTradeByTokens(\n      where: {\n        Transaction: { Result: { Success: true } },\n        Trade: {\n          Currency: { MintAddress: { is: $baseToken } },\n          Side: { Currency: { MintAddress: { is: $quoteToken } } },\n          Market: { MarketAddress: { is: $poolId } }\n        }\n      },\n      limitBy: { count: 1, by: Trade_Dex_ProtocolName },\n      orderBy: { descending: Trade_PriceInUSD }\n    ) {\n      Trade {\n        Price\n        PriceInUSD\n        PriceAsymmetry\n      }\n    }\n  }\n}`;

    return this.xior.post<Response<Price>>(this.path, {
      query,
      variables,
    });
  }
}
