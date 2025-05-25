import path from "path";
import millify from "millify";
import { readFileSync } from "fs";
import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

import { format } from "../../../../utils/format";
import { getTokenImage } from "../../../../utils/to-image-url";

type PrefetchedData = {
  mintA: {
    name: string;
    symbol: string;
    logoURI: string;
    address: string;
  };
  mintB: {
    name: string;
    symbol: string;
    logoURI: string;
    address: string;
  };
  feeRate: number;
  tvl: number;
  day: {
    apr: number;
    volume: number;
    volumeFee: number;
  };
  position: {
    tokenAmountA: number;
    tokenAmountB: number;
    tokenARewardInUSD: number;
    tokenBRewardInUSD: number;
    rewardInUSD: number;
  };
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const {
    mintA,
    mintB,
    feeRate,
    tvl,
    day: { volume, volumeFee, apr },
    position,
  } = JSON.parse(searchParams.get("data")) as PrefetchedData;

  console.log(position);

  console.log(
    position.tokenARewardInUSD +
      position.tokenBRewardInUSD +
      position.rewardInUSD
  );

  const stats = [
    {
      label: "solana",
      value: format("%s/%s", mintA.symbol, mintB.symbol),
    },
    {
      label: "Fees",
      value: format("%s%", feeRate * 100),
    },
    {
      label: "Liquidity",
      value: format("$%s", millify(tvl, { precision: 2 })),
    },
    {
      label: "24H VOL",
      value: format("$%s", millify(volume, { precision: 2 })),
    },
    {
      label: "24H Fee",
      value: format("$%s", millify(volumeFee, { precision: 2 })),
    },
    {
      label: "24H APR",
      value: format("%s%", apr.toFixed(2)),
    },
    {
      label: "Position",
      value: format(
        "$%s",
        millify(position.tokenAmountA + position.tokenAmountB, {
          precision: 2,
        })
      ),
    },
    {
      label: "Yield",
      value: format(
        "$%s",
        millify(
          position.tokenARewardInUSD +
            position.tokenBRewardInUSD +
            position.rewardInUSD,
          { precision: 6 }
        )
      ),
    },
  ];

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
                  src={getTokenImage(mintA.logoURI, mintA.address)}
                  alt={mintA.name}
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
                  src={getTokenImage(mintB.logoURI, mintB.address)}
                  alt={mintB.name}
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
                  src={format("%s%s", url.origin, "/images/solana.png")}
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
                  src={format("%s%s", url.origin, "/images/raydium.svg")}
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
              {stats.map((item, index) => (
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
            path.join(
              process.cwd(),
              "src/app/assets/fonts/iAWriterDuospace-Regular.ttf"
            )
          ),
          weight: 500,
        },
        {
          name: "aiWriterDouspace",
          data: readFileSync(
            path.join(
              process.cwd(),
              "src/app/assets/fonts/iAWriterDuospace-Bold.ttf"
            )
          ),
          weight: 600,
        },
      ],
    }
  );
}
