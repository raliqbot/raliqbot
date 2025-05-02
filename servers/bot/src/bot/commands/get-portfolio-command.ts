import type { Context, Telegraf } from "telegraf";
import { DEVNET_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";

export const getPortfolioCommand = (telegraf: Telegraf) => {
  const onGetPortfolio = async (context: Context) => {
    const porfolio = await context.raydium.clmm.getOwnerPositionInfo({
      programId: DEVNET_PROGRAM_ID.CLMM,
    });

    
  };

  telegraf.action("porfolio", onGetPortfolio);
  telegraf.command("porfolio", onGetPortfolio);
};
