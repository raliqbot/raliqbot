export type Position = {
  id: string;
  pool: string;
  wallet: string;
  algorithm: "spot" | "single-sided";
  metadata: {
    upperTick: number;
    lowerTick: number;
    liquidity: string;
    amountA: number;
    amountB: number;
    stopLossPercentage?: number;
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
