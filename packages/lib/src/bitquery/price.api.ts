import { ApiImpl } from "@raliqbot/shared";

import type { Price } from "./models/price.model";
import type { Response } from "./models/response.model";

export class PriceApi extends ApiImpl {
  protected path: string = "eap";

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
