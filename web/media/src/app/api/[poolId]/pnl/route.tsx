import path from "path";
import moment from "moment";
import { readFileSync } from "fs";
import { ImageResponse } from "next/og";
import { web3 } from "@coral-xyz/anchor";
import { format } from "@raliqbot/shared";
import { NextRequest } from "next/server";
import { getPortfolio } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { api, bitquery } from "../../../../instances";
import { getClusterURL } from "../../../../utils/refine-cluster";

export const GET = async (request: NextRequest, { params }) => {
  const { poolId: positionId } = await params;
  const { searchParams, origin } = new URL(request.url);
  const owner = searchParams.get("owner")!;
  const cluster = searchParams.get("cluster")! as "mainnet" | "devnet";

  const raydium = await Raydium.load({
    cluster: cluster ? cluster : "mainnet",
    owner: new web3.PublicKey(owner),
    connection: new web3.Connection(getClusterURL(cluster)),
  });

  const cachedPosition = await api.position
    .getPosition(positionId)
    .then(({ data }) => data);

  const positions = await raydium.clmm
    .getOwnerPositionInfo({
      programId: CLMM_PROGRAM_ID,
    })
    .then((positions) =>
      positions.filter((position) =>
        position.nftMint.equals(new web3.PublicKey(positionId))
      )
    );

  const [
    {
      pool: {
        poolInfo,
        price: { Price, PriceInUSD },
      },
      positions: [position],
    },
  ] = await getPortfolio(raydium, bitquery, CLMM_PROGRAM_ID, positions);

  const oldTokenAUSD = cachedPosition.metadata.amountA * PriceInUSD;
  const oldTokenBUSD = cachedPosition.metadata.amountB * (PriceInUSD / Price);
  const oldTokenUSD = oldTokenAUSD + oldTokenBUSD;

  const newTokenUSD =
    position.amountAUSD +
    position.amountBUSD +
    position.tokenFeesAUSD +
    position.tokenFeesBUSD;

  const pnl = ((newTokenUSD - oldTokenUSD) / oldTokenUSD) * 100;
  const profit = pnl > 0;
  const sign = pnl > 0 ? "+" : "-";
  const banner = format(
    "%%",
    origin,
    profit ? "/images/profit_banner.png" : "/images/loss_banner.png"
  );

  return new ImageResponse(
    (
      <div
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
        <img
          src={banner}
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
                color: profit
                  ? "#00c951"
                  : "rgba(217, 144, 106, 1)",
                fontWeight: "900",
                margin: 0,
                padding: 0,
              }}
            >
              <span
                style={{
                  backgroundColor: profit
                    ? "rgba(0,201,81,0.25)"
                    : "rgba(178,108,72,0.25)",
                  padding: "0 0.25rem",
                }}
              >
                {sign}$
              </span>
              &nbsp;
              <span>
                {Math.abs(newTokenUSD - oldTokenUSD).toFixed(
                  newTokenUSD - oldTokenUSD > 1 ? 2 : 4
                )}
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
            {[
              [
                {
                  label: "Time",
                  value: moment
                    .duration(moment().diff(moment(cachedPosition.createdAt)))
                    .humanize(),
                },
                {
                  label: "POOL",
                  value: `${poolInfo.mintA.symbol}-${poolInfo.mintB.symbol}`,
                },
              ],
              [
                {
                  label: "REWARD",
                  value: `$${(
                    position.tokenFeesAUSD + position.tokenFeesBUSD
                  ).toFixed(2)}`,
                },
                {
                  label: "PNL",
                  value: `${sign}${
                    Number.isFinite(pnl) ? Math.abs(pnl).toFixed(2) : 100
                  }%`,
                },
              ],
            ].map((grid, index) => (
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
};
