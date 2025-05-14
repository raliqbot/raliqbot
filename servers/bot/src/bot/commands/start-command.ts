import { Input, Markup, TelegramError, type Telegraf } from "telegraf";

import { connection } from "../../instances";
import { cleanText, readFileSync } from "../utils";
import { onOpenPosition } from "./open-position-command";
import { onCreatePosition } from "../actions/create-position-action";
import { getEnv } from "core";

export const startCommand = (telegraf: Telegraf) => {
  telegraf.start(async (context) => {
    console.log("chat.id=", context.chat.id);
    const { wallet } = context;
    if (context.message.text) {
      if (/open/.test(context.message.text)) return onOpenPosition(context);
      if (/createPosition/.test(context.message.text))
        return onCreatePosition(context);
    }

    if (context.chat.type === "private") {
      const solBalance =
        (await connection.getBalance(wallet.publicKey)) / Math.pow(10, 9);
      console.log(getEnv("CHANNNEL_ID"));

      return context.telegram
        .approveChatJoinRequest(getEnv("CHANNNEL_ID"), context.from.id)
        .catch((error) => {
          if (error instanceof TelegramError) {
            if (error.description === "USER_ALREADY_PARTICIPANT") {
              return context.replyWithAnimation(
                Input.fromLocalFile("assets/welcome.gif"),
                {
                  caption: readFileSync(
                    "locale/en/start/welcome-message.md",
                    "utf-8"
                  )
                    .replace(
                      "%address%",
                      cleanText(wallet.publicKey.toBase58())
                    )
                    .replace("%balance%", cleanText(String(solBalance))),
                  parse_mode: "MarkdownV2",
                  reply_markup: Markup.inlineKeyboard([
                    [
                      Markup.button.callback(
                        "➕ Open Position",
                        "open_position"
                      ),
                    ],
                    [
                      Markup.button.callback("💼 Porfolio", "portfolio"),
                      Markup.button.callback("💳 Wallet", "wallet"),
                    ],
                    [
                      Markup.button.callback("⚙️ Settings", "settings"),
                      Markup.button.callback("🆘 Help", "help"),
                    ],
                  ]).reply_markup,
                }
              );
            }

            console.error(error);
          }
        });
    }
  });
};
startCommand.commandName = "settings";
startCommand.help = "Update and upgrade bot to latest version.";
