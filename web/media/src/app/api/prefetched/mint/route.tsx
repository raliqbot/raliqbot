import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { getTokenImage } from "../../../../utils/to-image-url";

type PrefetchedData = {
  mintA: {
    name: string;
    address: string;
    logoURL: string;
  };
  mintB: {
    name: string;
    address: string;
    logoURL: string;
  };
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { mintA, mintB } = JSON.parse(
    searchParams.get("data")
  ) as PrefetchedData;

  return new ImageResponse(
    (
      <div
        id="media"
        style={{
          display: "flex",
          justifyContent: "center",
          justifyItems: "center",
          width: "4rem",
          height: "4rem",
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
            src={getTokenImage(mintA.logoURL, mintA.address)}
            alt={mintA.name}
            width={32}
            height={32}
            style={{
              position: "absolute",
              objectFit: "fill",
              border: "2px",
              borderColor: "white",
              borderRadius: "9999px",
            }}
          />
          <img
            src={getTokenImage(mintB.logoURL, mintB.address)}
            alt={mintB.name}
            width={32}
            height={32}
            style={{
              position: "absolute",
              right: "0",
              objectFit: "fill",
              border: "2px",
              borderColor: "white",
              borderRadius: "9999px",
            }}
          />
        </div>
      </div>
    ),
    { width: 64, height: 32 }
  );
}
