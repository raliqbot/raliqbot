import Image from "next/image";

import { isValidClmm } from "@raliqbot/lib";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import {
  type ApiV3PoolInfoConcentratedItem,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

type PageProps = {
  searchParams: Promise<{ cluster: "mainnet" | "devnet" | undefined }>;
  params: Promise<{ poolId: string }>;
};

export default async function poolId({ params, searchParams }: PageProps) {
  const { poolId } = await params;
  const { cluster } = await searchParams;
  const refinedCluster = cluster === "mainnet" ? "mainnet-beta" : cluster;

  const raydium = await Raydium.load({
    cluster: cluster ? cluster : "mainnet",
    connection: new Connection(
      clusterApiUrl(refinedCluster)
    ) as unknown as Parameters<typeof Raydium.load>[number]["connection"],
  });

  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;

  if (cluster === "mainnet") {
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
    return (
      <div id="media" className="relative size-14">
        <Image
          src={poolInfo.mintA.logoURI}
          alt={poolInfo.mintA.name}
          width={32}
          height={32}
          className="absolute rounded-full object-full"
        />
        <Image
          src={poolInfo.mintB.logoURI}
          alt={poolInfo.mintB.name}
          width={32}
          height={32}
          className="absolute right-0 object-full"
        />
      </div>
    );
  }
}
