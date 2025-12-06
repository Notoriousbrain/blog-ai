import { SerperResponse } from "@/src/types";
import { tool } from "ai";
import { z } from "zod";

export const searchWebTool = tool({
  description: "Search the web for factual information",
  inputSchema: z.object({
    query: z.string(),
  }),

  execute: async ({ query }) => {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      console.warn("[searchWebTool] Missing SERPER_API_KEY.");
      return [];
    }

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 5 }),
    });

    if (!response.ok) {
      console.warn(
        "[searchWebTool] Serper returned non-OK status:",
        response.status
      );
      return [];
    }

    const json = (await response.json()) as SerperResponse;
    const organic = Array.isArray(json.organic) ? json.organic : [];

    return organic
      .map((item): { title: string; url: string; snippet: string } => ({
        title: item.title?.trim() ?? "",
        url: item.link?.trim() ?? "",
        snippet: item.snippet?.trim() ?? "",
      }))
      .filter((r) => r.url.length > 0);
  },
});
