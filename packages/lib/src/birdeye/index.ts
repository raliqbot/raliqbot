import type { XiorInstance } from "xior";
import xior from "xior";

export class BirdEye {
  private readonly xior: XiorInstance;

  constructor(apiKey: string, baseURL: string) {
    this.xior = xior.create({
      baseURL,
      headers: {
        "x-api-key": apiKey,
      },
    });
  }
}
