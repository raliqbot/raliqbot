import { count, eq, gt, sql } from "drizzle-orm";
import type { web3 } from "@coral-xyz/anchor";

import type { Database } from "../db";
import { positions } from "../db/schema";

export const reposition = async (db: Database, connection: web3.Connection) => {
  const pools = await db.query.pools
    .findMany({
      with: {
        positions: {
          with: {
            wallet: true,
          },
          where: eq(positions.enabled, true),
          extras: {
            positionLength: count(positions.id).as("positionLength"),
          },
        },
      },
      where: gt(sql`positionLength`, 0),
    })
    .execute();

  for (const pool of pools) {
    // get pool price
    // check pool metadata 
    // if constraint met withdraw liquidity from pool 
    // reposition and close position
  }
};
