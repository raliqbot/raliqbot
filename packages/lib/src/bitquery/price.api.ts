import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from 'url';
import { ApiImpl } from "@raliqbot/shared";

import type { Price } from "./models/price.model";
import type { Response } from "./models/response.model";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PriceApi extends ApiImpl {
  protected path: string = "eap";

  getPairPrice(variables: {
    baseToken: string;
    quoteToken: string;
    poolId: string;
  }) {
    return this.xior.post<Response<Price>>(this.path, {
      query: readFileSync(
        path.join(__dirname, "queries/fetch_price.graphql"),
        "utf-8"
      ),
      variables,
    });
  }
}
