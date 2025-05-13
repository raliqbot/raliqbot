export type Price = {
  Solana: {
    DEXTradeByTokens: {
      Trade: { Price: number; PriceAsymmetry: number; PriceInUSD: number };
    }[];
  };
};

export type AvgPrice = {
  Solana: {
    DEXTradeByTokens: {
      Price: number;
      PriceInUSD: number;
    }[];
  };
};
