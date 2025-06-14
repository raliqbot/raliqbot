import { join } from "path";
import type { XiorInstance } from "xior";

import { format } from "./utils";

export abstract class ApiImpl {
  protected abstract path: string;

  constructor(protected readonly xior: XiorInstance) {}

  protected buildPath(...path: (string | number)[]) {
    return join(
      this.path,
      path.map(String).reduce((a, b) => join(a, b))
    );
  }

  protected buildPathWithQueryString(
    path: string,
    query?: Record<string, string | boolean| number | string[]>
  ) {
    let encodedQuery;
    if (query)
      encodedQuery = Object.fromEntries(
        Object.entries(query).map(([key, value]) => {
          if (Array.isArray(value)) return [key, value.join(",")];
          else return [key, value.toString()];
        })
      );
    const q = new URLSearchParams(encodedQuery);
    return format("%?%", path, q.toString());
  }
}
