import { ApiImpl } from "@raliqbot/shared";
import { Pair } from "./model/pair.model";

export class TokenApi extends ApiImpl {
  protected path: string = "tokens/v1";

  getPairs(...tokenAddresses: string[]) {
    return this.xior.get<Pair[]>(this.buildPath("solana", tokenAddresses.join(",")));
  }
}
