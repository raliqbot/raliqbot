import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { web3 } from "@coral-xyz/anchor";
import { isValidClmm } from "@raliqbot/lib";
import {
  type ApiV3PoolInfoConcentratedItem,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { getTokenImage } from "../../../../utils/to-image-url";
import { getClusterURL } from "../../../../utils/refine-cluster";

export async function GET(request: NextRequest, { params }) {
  const { poolId } = await params;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const cluster = searchParams.get("cluster")! as "mainnet" | "devnet";

  const raydium = await Raydium.load({
    cluster: cluster ? cluster : "mainnet",
    connection: new web3.Connection(getClusterURL(cluster)),
  });

  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;

  if (raydium.cluster === "mainnet") {
    const pools = await raydium.api.fetchPoolById({ ids: poolId });

    for (const pool of pools) {
      if (isValidClmm(pool.programId)) {
        poolInfo = pool as ApiV3PoolInfoConcentratedItem;
        break;
      }
    }
  } else {
    const pool = await raydium.clmm.getPoolInfoFromRpc(poolId);
    poolInfo = pool.poolInfo;
  }

  if (poolInfo) {
    return new ImageResponse(
      (
        <div
          id="media"
          style={{
            display: "flex",
            justifyContent: "center",
            justifyItems: "center",
            width: "6rem",
            height: "6rem",
            borderRadius: "9999px",
          }}
        >
          <div
            className="relative w-16 h-12"
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              width: "4rem",
              height: "3rem",
            }}
          >
            <img
              src={getTokenImage(
                poolInfo.mintA.logoURI,
                poolInfo.mintA.address
              )}
              alt={poolInfo.mintA.name}
              width={32}
              height={32}
              style={{
                position: "absolute",
                left: "-0.5rem",
                objectFit: "fill",
                borderRadius: "9999px",
              }}
            />
            <img
              src={getTokenImage(
                poolInfo.mintB.logoURI,
                poolInfo.mintB.address
              )}
              alt={poolInfo.mintB.name}
              width={32}
              height={32}
              style={{
                position: "absolute",
                right: "-0.5rem",
                objectFit: "fill",
                borderRadius: "9999px",
              }}
            />
          </div>
        </div>
      ),
      { width: 96, height: 50 }
    );
  }
}
