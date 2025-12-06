import { SearchResult, SearchWebResponse, SerperOrganicItem } from "@/src/types";

export async function searchWeb(query: string): Promise<SearchWebResponse> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    console.warn(
      "[searchWeb] SERPER_API_KEY is not set. Returning empty results."
    );
    return { results: [] };
  }

  try {
    const res = await fetch("https://api.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 5,
      }),
    });

    if (!res.ok) {
      console.error("[searchWeb] Non-OK response", res.status);
      return { results: [] };
    }

    const json = (await res.json()) as {
      organic?: SerperOrganicItem[];
    };

    const organic = Array.isArray(json.organic) ? json.organic : [];

    const results: SearchResult[] = organic
      .map(
        (item): SearchResult => ({
          title: String(item.title ?? "").trim(),
          url: String(item.link ?? "").trim(),
          snippet: String(item.snippet ?? "").trim(),
        })
      )
      .filter((r) => r.url);

    return { results };
  } catch (err) {
    console.error("[searchWeb] Error", err);
    return { results: [] };
  }
}
