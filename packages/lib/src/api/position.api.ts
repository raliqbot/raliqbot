import { ApiImpl } from "@raliqbot/shared";
import { Position } from "./models";

export class PositionApi extends ApiImpl {
  protected path: string = "positions";

  getPosition(id: string) {
    return this.xior.get<Position | null>(this.buildPath(id));
  }
}
