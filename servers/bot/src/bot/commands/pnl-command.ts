import { Context, Input, Telegraf } from "telegraf";

import { buildMediaURL, format } from "../../core";

export const pnlCommand = (telegraf: Telegraf) => {
  const onPNL = (context: Context) => {
    const text =
      context.message && "text" in context.message
        ? context.message.text
        : context.callbackQuery && "data" in context.callbackQuery
        ? context.callbackQuery.data
        : undefined;

    if (text) {
      const [, ...addresses] = text.split(/\s+|,|-/g);
      console.log(
        buildMediaURL(format("%/pnl/", addresses[0]), {
          owner: context.raydium.ownerPubKey.toBase58(),
          cluster: context.raydium.cluster,
        })
      );
      return Promise.all(
        addresses.map((address) =>
          context.replyWithPhoto(
            Input.fromURLStream(
              buildMediaURL(format("%/pnl/", address), {
                owner: context.raydium.ownerPubKey.toBase58(),
                cluster: context.raydium.cluster,
              })
            )
          )
        )
      );
    }
  };

  const commandFilter = /^pnl(?:-([1-9A-HJ-NP-Za-km-z]{32,44}))?$/;
  telegraf.action(commandFilter, onPNL);
  telegraf.command(commandFilter, onPNL);
};

pnlCommand.commandName = "pnl";
pnlCommand.description = "Get pnl for a position. positionId is optional.";
