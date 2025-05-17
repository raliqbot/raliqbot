"use client";

import { TypeAnimation } from "react-type-animation";

export const Text = () => (
  <TypeAnimation
    className="text-2xl font-bold md:max-w-lg md:text-4xl text-start"
    sequence={[
      "Liquidity Provision Made Easier with Raliqbot.",
      "Just a click away from providing liquidity on Raydium.",
    ]}
  />
);
