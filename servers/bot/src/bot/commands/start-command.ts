import { format } from "@raliqbot/shared";
import { Input, Markup, type Telegraf } from "telegraf";

import { getEnv } from "../../core";
import { connection } from "../../instances";
import { cleanText, readFileSync } from "../utils";
import { onOpenPosition } from "./open-position-command";
import { onCreatePosition } from "../actions/create-position-action";

export const startCommand = (telegraf: Telegraf) => {
  telegraf.start(async (context) => {
    const { wallet } = context;

    if (context.message.text) {
      if (/open/.test(context.message.text)) return onOpenPosition(context);
      if (/createPosition/.test(context.message.text))
        return onCreatePosition(context);
    }

    const solBalance =
      (await connection.getBalance(wallet.publicKey)) / Math.pow(10, 9);

    return context.replyWithAnimation(
      Input.fromLocalFile("assets/welcome.gif"),
      {
        caption: readFileSync("locale/en/start/welcome-message.md", "utf-8")
          .replace("%address%", cleanText(wallet.publicKey.toBase58()))
          .replace("%balance%", cleanText(String(solBalance))),
        parse_mode: "MarkdownV2",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.switchToCurrentChat("🔍 Search for pairs", "")],
          [Markup.button.callback("➕ Open Position", "open_position")],
          [
            Markup.button.url(
              "💼 Porfolio",
              format(
                "%?address=%&cluster=%",
                getEnv("MEDIA_APP_URL").replace(/api\//g, "porfolio"),
                context.wallet.publicKey,
                context.raydium.cluster
              )
            ),
            Markup.button.callback("💳 Wallet", "wallet"),
          ],
          [
            Markup.button.callback("⚙️ Settings", "settings"),
            Markup.button.callback("🆘 Help", "help"),
          ],
        ]).reply_markup,
      }
    );
  });
};
