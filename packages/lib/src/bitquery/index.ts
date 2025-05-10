import { format } from "@raliqbot/shared";
import xior, { XiorInstance } from "xior";

import { PriceApi } from "./price.api";

export class BitQuery {
  private xior: XiorInstance;

  readonly price: PriceApi;

  constructor(accessToken: string, baseURL = "https://streaming.bitquery.io") {
    this.xior = xior.create({
      baseURL,
      headers: {
        Authorization: format("Bearer %", accessToken),
      },
    });

    this.price = new PriceApi(this.xior);
  }
}
