import type { Context } from "telegraf";
import { readFileSync as fsReadFileSync } from "fs";

export function cleanText(value: string) {
  return value
    .replace(/\_/g, "\\_")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\*/g, "\\*")
    .replace(/\|/g, "\\|")
    .replace(/\>/g, "\\>")
    .replace(/\</g, "\\<")
    .replace(/\`/g, "\\`")
    .replace(/\~/g, "\\~")
    .replace(/\#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/\-/g, "\\-")
    .replace(/\=/g, "\\=")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/\!/g, "\\!");
}

export function readFileSync(context: Context, path: string) {
  const file = path.replace(/locale/, context.user.settings.data.locale);
  return fsReadFileSync(file, "utf-8");
}
