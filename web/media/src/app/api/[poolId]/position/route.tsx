import { readFileSync } from "fs";
import millify from "millify";
import { format } from "@raliqbot/shared";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { web3 } from "@coral-xyz/anchor";
import { isValidClmm } from "@raliqbot/lib";
import {
  ApiV3PoolInfoConcentratedItem,
  CLMM_PROGRAM_ID,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";

import { getTokenImage } from "../../../../utils/to-image-url";
import { getClusterURL } from "../../../../utils/refine-cluster";

export async function GET(request: NextRequest, { params }) {
  const { poolId: positionId } = await params;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const owner = searchParams.get("owner")!;
  const cluster = searchParams.get("cluster")! as "mainnet" | "devnet";

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

  const stats = [
    {
      label: "Fees",
      value: `${poolInfo.feeRate * 100}%`,
    },
    {
      label: "Liquidity",
      value: `$${poolInfo.tvl}`,
    },
    {
      label: "24H VOL",
      value: `$${millify(poolInfo.day.volume)}`,
    },
    {
      label: "24H Fee",
      value: `$${millify(poolInfo.day.volumeFee)}`,
    },
    {
      label: "24H APR",
      value: `${poolInfo.day.apr.toFixed(2)}%`,
    },
  ];

  if (poolInfo) {
    return new ImageResponse(
      (
        <div
          id="media"
          style={{
            width: "100%",
            height: "24rem",
            display: "flex",
            position: "relative",
            flexDirection: "column",
            backgroundColor: "black",
            fontFamily: "aiWriterDouspace",
            fontSize: 400,
          }}
        >
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(59,130,246,0.5)",
              width: "100%",
              height: "14rem",
              zIndex: 0,
            }}
          >
            <div
              style={{
                margin: "auto",
                width: "33.33%",
                height: "100%",
                display: "flex",
              }}
            >
              <div
                style={{
                  borderRight: "2px dashed #f0f9ff",
                  height: "100%",
                  width: "0.5rem",
                }}
              />
              <div
                style={{
                  backgroundColor: "#3b82f6",
                  height: "100%",
                  width: "100%",
                }}
              />
            </div>
          </div>
          <div
            style={{
              bottom: 0,
              position: "absolute",
              display: "flex",
              width: "100%",
              padding: "1rem",
              backgroundImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.5), black)",
              color: "white",
              zIndex: "10",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "2rem",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  columnGap: "2rem",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    width: "5rem",
                    height: "2.5rem",
                  }}
                >
                  <img
                    src={getTokenImage(
                      poolInfo.mintA.logoURI,
                      poolInfo.mintA.address
                    )}
                    alt={poolInfo.mintA.name}
                    width={48}
                    height={48}
                    style={{
                      position: "absolute",
                      borderRadius: "9999px",
                      objectFit: "fill",
                      border: "1px solid white",
                      boxShadow: "0 0 0 2px white",
                    }}
                  />
                  <img
                    src={getTokenImage(
                      poolInfo.mintB.logoURI,
                      poolInfo.mintB.address
                    )}
                    alt={poolInfo.mintB.name}
                    width={48}
                    height={48}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "1rem",
                      borderRadius: "9999px",
                      objectFit: "fill",
                      border: "1px solid white",
                      boxShadow: "0 0 0 2px white",
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex" }}>
                  <img
                    src={format("%%", url.origin, "/images/solana.png")}
                    width={32}
                    height={32}
                    alt="solana"
                    style={{
                      borderRadius: "0.75rem",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    width: "2.5rem",
                    height: "2.5rem",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "white",
                    borderRadius: "9999px",
                  }}
                >
                  <img
                    src={format("%%", url.origin, "/images/raydium.svg")}
                    width={24}
                    height={24}
                    alt="raydium"
                  />
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  gap: "1rem",
                  display: "flex",
                  flexWrap: "nowrap",
                  overflowX: "auto",
                }}
              >
                {[
                  {
                    label: "solana",
                    value: format(
                      "%-%",
                      poolInfo.mintA.symbol,
                      poolInfo.mintB.symbol
                    ),
                  },
                  {
                    label: "Fees",
                    value: `${poolInfo.feeRate * 100}%`,
                  },
                  {
                    label: "Liquidity",
                    value: `$${poolInfo.tvl}`,
                  },
                  {
                    label: "24H VOL",
                    value: `$${millify(poolInfo.day.volume)}`,
                  },
                  {
                    label: "24H Fee",
                    value: `$${millify(poolInfo.day.volumeFee)}`,
                  },
                  {
                    label: "24H APR",
                    value: `${poolInfo.day.apr.toFixed(2)}%`,
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      display: "flex",
                      gap: "0",
                      flexDirection: "column",
                    }}
                  >
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.875rem",
                        color: "rgba(255, 255, 255, 0.75)",
                        whiteSpace: "nowrap",
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "0.875rem",
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 384,
        fonts: [
          {
            name: "aiWriterDouspace",
            data: readFileSync(
              "src/app/assets/fonts/iAWriterDuospace-Regular.ttf"
            ),
            weight: 500,
          },
          {
            name: "aiWriterDouspace",
            data: readFileSync(
              "src/app/assets/fonts/iAWriterDuospace-Bold.ttf"
            ),
            weight: 600,
          },
        ],
      }
    );
  }
}
