import { aiGatewayChat } from "@/src/lib/ai-gateway";
import { cleanLLMJson } from "@/src/lib/clean-json";
import { AgentResearchResult, AgentWriterOutput, BlogRow } from "@/src/types";

async function humanRewriteLoop(content: string): Promise<string> {
  let current = content;
  let pass = 0;

  while (pass < 3) {
    const rewritten = await aiGatewayChat([
      {
        role: "system",
        content: "Rewrite text so it reads like a normal person wrote it.",
      },
      {
        role: "user",
        content: `Rewrite the article with these rules:
- Expand the content to roughly 2x the original length
- Break it into 3-4 paragraphs, each with 3-5 sentences
- Use simple, everyday English
- Avoid filler words and AI-sounding phrasing
- No "However", "Moreover", "In addition", "Therefore"
- No em dashes
- Keep the original meaning, but explain ideas more fully
- Improve transitions and readability
- Add natural spacing between paragraphs
- Return ONLY the rewritten article text. Do NOT return JSON

ARTICLE:
${current}
`.trim(),
      },
    ]);

    current = rewritten.trim();
    pass++;
  }

  return current;
}

export async function writeArticleFromResearch(params: {
  blog: BlogRow;
  research: AgentResearchResult;
}): Promise<AgentWriterOutput> {
  const { blog, research } = params;

  const raw = await aiGatewayChat([
    {
      role: "system",
      content:
        "You are a senior content writer. " +
        "You write clear, human-sounding blog articles based on research notes. " +
        'Respond ONLY with valid JSON of shape: { "article": string, "heroPrompt": string }',
    },
    {
      role: "user",
      content: `
Write a blog article based on the following information.

Title:
${blog.title}

Research notes (multiple sources):
${research.researchSummary}

Requirements:
- Write as if you are a normal human writer, not an AI.
- Be factual and grounded in the research.
- Use simple, conversational English.
- Avoid fluff and buzzwords.
- No meta-commentary like "In this article".
- No title in the article body (title is stored separately).

Also generate a hero image prompt that a text-to-image model can use.

Return ONLY JSON:
{
  "article": "full article here...",
  "heroPrompt": "short prompt for a cinematic 16:9 hero image"
}
`.trim(),
    },
  ]);

  let article = "";
  let heroPrompt = "";

  try {
    const cleaned = cleanLLMJson(raw);

    const parsed = JSON.parse(cleaned) as {
      article?: unknown;
      heroPrompt?: unknown;
    };

    article = String(parsed.article ?? "").trim();
    heroPrompt = String(parsed.heroPrompt ?? "").trim();
  } catch (err) {
    console.warn(
      "[writeArticleFromResearch] Failed to parse JSON. Using raw output as article.",
      err
    );
    article = raw.trim();
  }

  if (!article) {
    throw new Error("Writer agent did not produce an article");
  }

  if (!heroPrompt) {
    heroPrompt = `Cinematic 16:9 editorial photograph representing the topic "${blog.title}". 
Realistic, horizontal composition, no text, natural lighting.`;
  }

  const rewritten = await humanRewriteLoop(article);

  return {
    article: rewritten,
    heroPrompt,
    researchSummary: research.researchSummary,
  };
}
