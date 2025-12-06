export function cleanLLMJson(raw: string): string {
  if (!raw) return raw;

  let out = raw.trim();

  out = out
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .trim();

  out = out.replace(/```$/, "").trim();

  const firstBrace = out.indexOf("{");
  const lastBrace = out.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    out = out.substring(firstBrace, lastBrace + 1).trim();
  }

  return out;
}
