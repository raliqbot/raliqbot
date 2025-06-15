import { StrategyType } from "@meteora-ag/dlmm";

export const Strategy = {
  spot: StrategyType.Spot,
  curve: StrategyType.Curve,
  "bid-ask": StrategyType.BidAsk,
} as const;

export const Strategies = Object.keys(Strategy) as (keyof typeof Strategy)[];
