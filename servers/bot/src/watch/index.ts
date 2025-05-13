import { web3 } from "@coral-xyz/anchor";

import { getEnv } from "../core";
import { bitquery, bot, db } from "../instances";
import { positionChecks } from "./position-check";

export const main = async () => {
  await positionChecks(
    db,
    bot,
    bitquery,
    new web3.Connection(getEnv("RPC_URL"))
  );
};
