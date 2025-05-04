import { web3 } from "@coral-xyz/anchor";
import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { refineCluser } from "../../../../utils/refine-cluster";

type PositionPageProps = {
  params: Promise<{ poolId: string; positionId: string }>;
  searchParams: Promise<{ address?: string; cluster: "mainnet" | "devnet" }>;
};
export default async function PositionPage({
  params,
  searchParams,
}: PositionPageProps) {
  const {poolId, positionId} = await params;
  const { cluster, address } = await searchParams;

  const raydium = await Raydium.load({
    owner: address ? new web3.PublicKey(address) : null,
    connection: new web3.Connection(refineCluser(cluster)),
  });

  const poolInfo = await raydium.api.fetchPoolById({ids: poolId });
  const positionInfo = await raydium.account;
}
