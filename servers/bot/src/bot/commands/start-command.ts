import { Input, Markup, type Telegraf } from "telegraf";

import { cleanText, readFileSync } from "../utils";
import { connection } from "../../instances";

export const startCommand = (telegraf: Telegraf) => {
  telegraf.start(async (context) => {
    const { wallet } = context;
    const solBalance = await connection.getBalance(wallet.publicKey);

    return context.replyWithAnimation(
      Input.fromLocalFile("assets/welcome.gif"),
      {
        caption: readFileSync("locale/en/start/welcome-message.md", "utf-8")
          .replace("%address%", cleanText(wallet.publicKey.toBase58()))
          .replace("%balance%", cleanText(String(solBalance))),
        parse_mode: "MarkdownV2",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.switchToCurrentChat("🔍 Search for pairs", "")],
          [
            Markup.button.callback("💼 Porfolio", "portfolio"),
            Markup.button.callback("💳 Wallet", "wallet"),
          ],
          [
            Markup.button.callback("⚙️ Settings", "settings"),
            Markup.button.callback("⚙️ Help", "help"),
          ],
        ]).reply_markup,
      }
    );
  });
};
