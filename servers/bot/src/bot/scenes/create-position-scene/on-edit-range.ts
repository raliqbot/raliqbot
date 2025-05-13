import { Context, Markup, Scenes } from "telegraf";

import { readFileSync } from "../../utils";
import { confirmPosition } from "./confirm-position";

export const onEditRange = async (
  context: Context,
  next: () => Promise<unknown>
) => {
  const text =
    context.message && "text" in context.message
      ? context.message.text
      : undefined;

  if (text) {
    let values = text
      .split(/\s+|,/)
      .map(parseFloat)
      .filter((value) => !Number.isNaN(value));

    values = values.map((value) => (value > 1 ? value / 100 : value));

    const { algorithm, singleSided } = context.session.createPosition;

    if (algorithm === "single-sided") {
      if (singleSided === "MintA") values = [0, values[0]];
      else values = [values[0], 0];
    } else {
      if (values.length < 2)
        return context.replyWithMarkdownV2(
          readFileSync("locale/en/create-position/invalid-range.md", "utf-8")
        );
    }

    context.session.createPosition.range = values as [number, number];
    return confirmPosition(context, next);
  }
};
