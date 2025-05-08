import { Markup, type Context, type Telegraf } from "telegraf";

import { format, getEnv } from "../../core";
import { connection } from "../../instances";
import { cleanText, readFileSync } from "../utils";

export const WalletCommand = (telegraf: Telegraf) => {
  const onWallet = async (context: Context) => {
    const address = context.wallet.publicKey.toBase58();
    const solBalance =
      (await connection.getBalance(context.wallet.publicKey)) / Math.pow(10, 9);

    return context.replyWithMarkdownV2(
      readFileSync("locale/en/wallet/wallet-detail.md", "utf-8")
        .replace(
          "%pnl_link%",
          format(
            "%?address=%&cluster=%",
            getEnv("MEDIA_APP_URL").replace(/api\//g, "porfolio"),
            context.wallet.publicKey,
            context.raydium.cluster
          )
        )
        .replace("%address%", cleanText(address))
        .replace("%sol_balance%", cleanText(solBalance.toString())),
      Markup.inlineKeyboard([
        [Markup.button.callback("⬇️ Import Private Key", "import-key")],
        [Markup.button.callback("⬆️ Export Private Key", "export-key")],
        [
          Markup.button.url(
            "View on SolScan",
            format("https://solscan.io/account/%/", address)
          ),
        ],
      ])
    );
  };
  telegraf.action("wallet", onWallet);
  telegraf.command("wallet", onWallet);
};
