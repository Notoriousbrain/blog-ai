export function normalizeExtractedText(text: string): string {
  if (!text) return "";

  const banned = [/cookie/i, /subscribe/i, /newsletter/i];

  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !banned.some((b) => b.test(l)))
    .join("\n");
}
