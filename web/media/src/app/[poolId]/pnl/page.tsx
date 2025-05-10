import moment from "moment";
import { web3 } from "@coral-xyz/anchor";
import { getPortfolio } from "@raliqbot/lib";
import { CLMM_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { api, bitquery } from "../../../instances";
import { getClusterURL } from "../../../utils/refine-cluster";

export default async ({ params, searchParams }) => {
  const { poolId: positionId } = await params;
  const { owner, cluster = "mainnet" } = await searchParams;

  const raydium = await Raydium.load({
    cluster,
    owner: new web3.PublicKey(owner),
    connection: new web3.Connection(getClusterURL(cluster)),
  });

  const cachedPosition = await api.position
    .getPosition(positionId)
    .then(({ data }) => data);

  console.log(cachedPosition);

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

  return (
    <div
      style={{
        position: "relative",
        display: "flex",

        height: "24rem",
        maxWidth: "38rem",
      }}
    >
      <img
        src={profit ? "/images/profit_banner.png" : "/images/loss_banner.png"}
        width={512}
        height={512}
        alt="Profit Banner"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
          position: "absolute",
          inset: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          color: "white",
          padding: "4rem",
        }}
      >
        <div style={{ display: "flex" }}>
          <h1
            style={{
              fontSize: "3.75rem",
              color: profit
                ? "oklch(72.3% 0.219 149.579)"
                : "oklch(63.7% 0.237 25.331)",
              fontWeight: "900",
              margin: 0,
              padding: 0,
            }}
          >
            <span
              style={{
                backgroundColor: profit
                  ? "rgba(59,156,144,0.25)"
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
            maxWidth: "60%",
            display: "flex",
            flexWrap: "wrap",
            gap: "2rem",
          }}
        >
          {[
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
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                flex: "1 1 0",
                display: "flex",
                flexDirection: "column",
                minWidth: "6rem",
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
      </div>
    </div>
  );
};
