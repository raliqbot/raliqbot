import millify from "millify";
import Image from "next/image";
import { web3 } from "@coral-xyz/anchor";
import { isValidClmm } from "@raliqbot/lib";
import {
  ApiV3PoolInfoConcentratedItem,
  CLMM_PROGRAM_ID,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { SolanaLogo, RaydiumLogo } from "../../assets";
import { getTokenImage } from "../../../utils/to-image-url";
import { getClusterURL } from "../../../utils/refine-cluster";

type PositionPageProps = {
  params: Promise<{ poolId: string }>;
  searchParams: Promise<{ cluster: "mainnet" | "devnet"; owner: string }>;
};
export default async function PositionPage({
  params,
  searchParams,
}: PositionPageProps) {
  const { poolId: positionId } = await params;
  const { cluster, owner } = await searchParams;

  const raydium = await Raydium.load({
    owner: new web3.PublicKey(owner),
    cluster: cluster ? cluster : "mainnet",
    disableLoadToken: false,
    connection: new web3.Connection(getClusterURL(cluster)),
  });

  let poolInfo: ApiV3PoolInfoConcentratedItem | undefined;

  const [position] = await raydium.clmm
    .getOwnerPositionInfo({
      programId: CLMM_PROGRAM_ID,
    })
    .then((positions) =>
      positions.filter((position) =>
        position.nftMint.equals(new web3.PublicKey(positionId))
      )
    );

  if (raydium.cluster === "mainnet") {
    const pools = await raydium.api.fetchPoolById({
      ids: position.poolId.toBase58(),
    });

    for (const pool of pools) {
      if (isValidClmm(pool.programId)) {
        poolInfo = pool as ApiV3PoolInfoConcentratedItem;
        break;
      }
    }
  } else {
    const pool = await raydium.clmm.getPoolInfoFromRpc(
      position.poolId.toBase58()
    );
    poolInfo = pool.poolInfo;
  }

  return (
    <div
      id="media"
      className="relative h-96"
    >
      <div className="absolute inset-0 bg-blue-500/50  w-full h-56">
        <div className="m-auto  w-1/3 h-full flex">
          <div className="border-r-2 border-sky-50 border-dashed h-full w-2" />
          <div className="bg-blue-500 h-full w-full" />
        </div>
      </div>
      <div className="absolute bottom-8 inset-0 flex flex-col items-end w-full p-4  bg-gradient-to-b from-black/25 via-black to-black text-white z-10">
        <div className="mt-auto w-full flex flex-col space-y-8">
          <div className="relative flex items-center space-x-8">
            <div className="relative w-20 h-10">
              <Image
                src={getTokenImage(
                  poolInfo.mintA.logoURI,
                  poolInfo.mintA.address
                )}
                alt={poolInfo.mintA.name}
                width={48}
                height={48}
                className="absolute rounded-full object-full border-1 border-white ring-2"
              />
              <Image
                src={getTokenImage(
                  poolInfo.mintB.logoURI,
                  poolInfo.mintB.address
                )}
                alt={poolInfo.mintB.name}
                width={48}
                height={48}
                className="absolute right-0 top-4 rounded-full object-full border-1 border-white ring-2"
              />
            </div>
            <div className="flex-1">
              <Image
                src={SolanaLogo.default}
                width={32}
                height={32}
                alt="solana"
                className="rounded-xl"
              />
            </div>
            <div className="w-8 h-8 p-0.5 bg-white rounded-full">
              <Image
                src={RaydiumLogo.default}
                width={32}
                height={32}
                alt="raydium"
              />
            </div>
          </div>
          <div className="flex-1 space-x-4 flex flex-nowrap overflow-scroll">
            <div className="flex flex-col">
              <p className="font-bold uppercase">solana</p>
              <p className="text-sm text-white/75 text-nowrap">
                {poolInfo.mintA.symbol}-{poolInfo.mintB.symbol}
              </p>
            </div>
            <div className="flex-1 flex flex-col">
              <p className="text-white/75 uppercase text-nowrap">Fees</p>
              <p className="text-sm font-bold">{poolInfo.feeRate * 100}%</p>
            </div>
            <div className="flex-1 flex flex-col">
              <p className="text-white/75 uppercase">Liquidity</p>
              <p className="text-sm font-bold">${poolInfo.tvl}</p>
            </div>
            <div className="flex-1 flex flex-col">
              <p className="text-white/75 uppercase text-nowrap">24H VOL</p>
              <p className="text-sm font-bold">
                ${millify(poolInfo.day.volume)}
              </p>
            </div>
            <div className="flex-1 flex flex-col">
              <p className="text-white/75 uppercase text-nowrap">24H Fee</p>
              <p className="text-sm font-bold">
                ${millify(poolInfo.day.volumeFee)}
              </p>
            </div>
            <div className="flex-1 flex flex-col">
              <p className="text-white/75 uppercase text-nowrap">24H APR</p>
              <p className="text-sm font-bold">
                {poolInfo.day.apr.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
