import path from "path";
import moment from "moment";
import millify from "millify";
import { readFileSync } from "fs";
import { ImageResponse } from "next/og";

import { NextRequest } from "next/server";
import { format } from "@raliqbot/shared";

type PrefetchedData = {
  cachedPosition: {
    createdAt: number;
  };
  rewardToken: {
    reward: number;
    rewardInUSD: number;
    mint: {
      name: string;
      symbol: string;
      logoURI: string;
    };
  };
  tokenA: {
    amountInUSD: number;
    rewardInUSD: number;
    mint: {
      name: string;
      symbol: string;
      logoURI: string;
    };
  };
  tokenB: {
    amountInUSD: number;
    rewardInUSD: number;
    mint: {
      name: string;
      symbol: string;
      logoURI: string;
    };
  };
};

export const GET = async (request: NextRequest) => {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const { cachedPosition, tokenA, tokenB, rewardToken } = JSON.parse(
    searchParams.get("data")
  ) as PrefetchedData;

  const rewardInUSD =
    tokenA.rewardInUSD + tokenB.rewardInUSD + rewardToken.rewardInUSD;

  const tvl = tokenA.amountInUSD + tokenB.amountInUSD;

  const stats = [
    [
      {
        label: "Time",
        value: moment
          .duration(moment().diff(moment(cachedPosition.createdAt)))
          .humanize(),
      },
      {
        label: "POOL",
        value: format("%/%", tokenA.mint.symbol, tokenB.mint.symbol),
      },
    ],
    [
      {
        label: "TVL",
        value: format(
          "$%",
          millify(tvl, { precision: Math.min(tvl.toString().length - 1, 2) })
        ),
      },
    ],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "32rem",
          display: "flex",
          position: "relative",
          flexDirection: "column",
          backgroundColor: "black",
          fontFamily: "aiWriterDouspace",
          fontSize: 400,
        }}
      >
        <img
          src={format("%%", url.origin, "/images/profit_banner.png")}
          width={800}
          height={384}
          alt="Profit Banner"
          style={{
            zIndex: "0",
            width: "100%",
            height: "100%",
            objectFit: "fill",
            position: "absolute",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            gap: "3rem",
            color: "white",
            padding: "4rem",
          }}
        >
          <div style={{ display: "flex" }}>
            <h1
              style={{
                fontSize: "3.75rem",
                color: "#00c951",
                fontWeight: "900",
                margin: 0,
                padding: 0,
              }}
            >
              <span
                style={{
                  backgroundColor: "rgba(0,201,81,0.25)",
                  padding: "0 0.25rem",
                }}
              >
                +$
                {millify(rewardInUSD, {
                  precision: Math.min(rewardInUSD.toString().length - 1, 4),
                })}
              </span>
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              flex: "1 1 0",
              gap: "2rem",
              flexDirection: "column",
            }}
          >
            {stats.map((grid, index) => (
              <div
                key={index}
                style={{ display: "flex", gap: "2rem", flex: "1 1 0" }}
              >
                {grid.map(({ label, value }, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <p
                      style={{
                        textTransform: "uppercase",
                        fontSize: "0.875rem",
                        color: "rgba(255, 255, 255, 0.75)",
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        whiteSpace: "nowrap",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 800,
      height: 512,
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
};
