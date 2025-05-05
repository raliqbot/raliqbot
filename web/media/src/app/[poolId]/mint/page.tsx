import Image from "next/image";

import { web3 } from "@coral-xyz/anchor";
import { isValidClmm } from "@raliqbot/lib";
import {
  type ApiV3PoolInfoConcentratedItem,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { getTokenImage } from "../../../utils/to-image-url";
import { getClusterURL } from "../../../utils/refine-cluster";

type PageProps = {
  searchParams: Promise<{ cluster: "mainnet" | "devnet" | undefined }>;
  params: Promise<{ poolId: string }>;
};

export default async function poolId({ params, searchParams }: PageProps) {
  const { poolId } = await params;
  const { cluster } = await searchParams;

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
    return (
      <div
        id="media"
        className="relative size-14"
      >
        <Image
          src={getTokenImage(poolInfo.mintA.logoURI, poolInfo.mintA.address)}
          alt={poolInfo.mintA.name}
          width={32}
          height={32}
          className="absolute object-full rounded-full"
        />
        <Image
          src={getTokenImage(poolInfo.mintB.logoURI, poolInfo.mintB.address)}
          alt={poolInfo.mintB.name}
          width={32}
          height={32}
          className="absolute right-0 object-full rounded-full"
        />
      </div>
    );
  }
}
