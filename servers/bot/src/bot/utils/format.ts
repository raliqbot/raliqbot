import moment from "moment";
import { type PathOrFileDescriptor, readFileSync as read } from "fs";

export function cleanText(value: string) {
  return value
    ? value
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
        .replace(/\!/g, "\\!")
    : "";
}

export function readFileSync(...params: Parameters<typeof read>): string;
export function readFileSync(descriptor: PathOrFileDescriptor): string;
export function readFileSync(
  descriptor: PathOrFileDescriptor,
  ...args: any[]
): string {
  if (args.length === 0) {
    const text = read(descriptor, "utf-8") as string;
    return cleanText(text);
  }

  return read(descriptor, ...args) as unknown as string;
}

export function formatSeconds(seconds: number) {
  if (seconds >= 3600) return moment.utc(seconds * 1000).format("H:mm");
  else return moment.utc(seconds * 1000).format("mM");
}
