import xior, { type XiorInstance } from "xior";
import { PositionApi } from "./position.api";

export class RaliqbotClient {
  private readonly xior: XiorInstance;

  readonly position: PositionApi;

  constructor(baseURL: string) {
    this.xior = xior.create({
      baseURL,
    });

    this.position = new PositionApi(this.xior);
  }
}
