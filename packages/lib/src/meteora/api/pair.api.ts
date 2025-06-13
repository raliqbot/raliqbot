import { ApiImpl } from "@raliqbot/shared";
import { Pair } from "./models";

export class PairApi extends ApiImpl {
  protected path: string = "pair";

  allWithPagination(args: {
    page?: number;
    limit?: number;
    tags?: string[];
    skip_size?: number;
    sort_key?: string;
    order_by?: string;
    search_term?: string;
    hide_low_tvl?: boolean;
    hide_low_apr?: boolean;
    pools_to_top?: string[];
    include_unknown?: boolean;
    include_token_mints?: string[];
    include_pool_token_pairs?: string[];
  }) {
    return this.xior
      .get<{ pairs: Pair[]; total: number }>(
        this.buildPathWithQueryString(
          this.buildPath("all_with_pagination"),
          args
        )
      )
      .then(({ data }) => data);
  }
}
