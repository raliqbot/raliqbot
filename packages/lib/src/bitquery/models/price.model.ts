export type Price = {
  Solana: {
    DEXTradeByTokens: {
      Trade: { Price: number; PriceAsymmetry: number; PriceInUSD: number };
    }[];
  };
};
