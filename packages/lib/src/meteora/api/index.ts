import xior, { XiorInstance } from "xior";
import { PairApi } from "./pair.api";

export class MeteoraClient {
  private readonly xior: XiorInstance;

  readonly pair: PairApi;

  constructor(baseURL: string = "https://dlmm-api.meteora.ag") {
    this.xior = xior.create({
      baseURL,
    });

    this.pair = new PairApi(this.xior);
  }
}
