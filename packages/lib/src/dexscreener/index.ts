import xior, { type XiorInstance } from "xior";

import { SearchApi } from "./search.api";
import { TokenApi } from "./token.api";

export class DexScreener {
  private readonly xior: XiorInstance;

  readonly token: TokenApi;
  readonly search: SearchApi;

  constructor(baseURL: string = "https://api.dexscreener.com") {
    this.xior = xior.create({
      baseURL,
    });

    this.token = new TokenApi(this.xior);
    this.search = new SearchApi(this.xior);
  }
}
