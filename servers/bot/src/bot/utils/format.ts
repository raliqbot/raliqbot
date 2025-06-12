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
