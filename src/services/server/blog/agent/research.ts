// src/services/server/blog/agent/research.ts
import { db } from "@/src/db";
import { blogSources } from "@/src/db/schema";
import { eq } from "drizzle-orm";

import { aiGatewayChat } from "@/src/lib/ai-gateway";
import { searchWeb } from "./tools/search-web";
import { scrapePage } from "./tools/scrape-page";
import { cleanLLMJson } from "@/src/lib/clean-json";
import { AgentInitialSources, AgentResearchPlan, AgentResearchResult, BlogRow, BlogSourceRow, ScrapedImage } from "@/src/types";

const MAX_SOURCES_TEXT_LENGTH = 15000;

export async function getInitialSourcesForBlog(
  blogId: string
): Promise<AgentInitialSources> {
  const rows = await db
    .select()
    .from(blogSources)
    .where(eq(blogSources.blogId, blogId));

  const urls = new Set<string>();
  const notes: string[] = [];

  rows.forEach((s: BlogSourceRow) => {
    if (s.type === "url" && s.sourceUrl) {
      urls.add(s.sourceUrl);
    } else if (s.type === "text" && s.rawContent) {
      notes.push(s.rawContent);
    }
  });

  return {
    urls: Array.from(urls),
    notes: notes.join("\n\n").slice(0, MAX_SOURCES_TEXT_LENGTH),
  };
}

async function planResearchForBlog(params: {
  blog: BlogRow;
  initial: AgentInitialSources;
}): Promise<AgentResearchPlan> {
  const { blog, initial } = params;

  if (initial.urls.length > 0) {
    return {
      searchQueries: [],
      extraUrls: [],
    };
  }

  const raw = await aiGatewayChat([
    {
      role: "system",
      content:
        "You are a strict research planner. ANY user-provided URL MUST be treated as the authoritative source.\n" +
        "NEVER infer or suggest a different company, entity, or domain.\n" +
        "If no URL is provided, generate simple, factual search queries.\n" +
        'Return ONLY JSON: { "searchQueries": string[], "extraUrls": string[] }',
    },
    {
      role: "user",
      content: `Blog Title: ${blog.title}

User-provided URLs: (none)
User Notes:
${initial.notes || "(none)"}
`,
    },
  ]);

  let plan: AgentResearchPlan = {
    searchQueries: [],
    extraUrls: [],
  };

  try {
    const parsed = JSON.parse(cleanLLMJson(raw));
    plan.searchQueries = Array.isArray(parsed.searchQueries)
      ? parsed.searchQueries
          .map((x: unknown) => String(x).trim())
          .filter(Boolean)
      : [];

    plan.extraUrls = [];
  } catch {
    plan = {
      searchQueries: [`${blog.title} key facts`],
      extraUrls: [],
    };
  }

  return plan;
}

export async function runResearchPhase(params: {
  blog: BlogRow;
  initial: AgentInitialSources;
}): Promise<AgentResearchResult> {
  const { blog, initial } = params;

  const urlSet = new Set(initial.urls);

  const scrapedChunks: string[] = [];
  const scrapedImages: ScrapedImage[] = [];

  const scrapedLength = scrapedChunks.join(" ").length;

  if (scrapedLength < 500) {
    const plan = await planResearchForBlog({ blog, initial });

    for (const query of plan.searchQueries.slice(0, 2)) {
      const res = await searchWeb(query);

      for (const r of res.results.slice(0, 2)) {
        if (!r.url) continue;
        if (!r.title.toLowerCase().includes(blog.title.toLowerCase())) continue;

        urlSet.add(r.url);
      }
    }

    for (const url of Array.from(urlSet)) {
      if (initial.urls.includes(url)) continue;

      const page = await scrapePage(url);
      if (!page?.text) continue;

      scrapedChunks.push(page.text);
      page.images.forEach((img) => scrapedImages.push(img));
    }
  }

  const combined = scrapedChunks
    .join("\n\n----------------\n\n")
    .slice(0, MAX_SOURCES_TEXT_LENGTH);

  return {
    researchSummary: combined,
    referencedUrls: Array.from(urlSet),
    scrapedImages,
  };
}
