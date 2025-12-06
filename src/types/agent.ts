import z from "zod/v4";

export interface AgentInitialSources {
  urls: string[];
  notes: string;
}

export interface ScrapedImage {
  url: string;
  width?: number;
  height?: number;
}

export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
  images: ScrapedImage[];
}

interface SerperOrganicItem {
  title?: string;
  link?: string;
  snippet?: string;
}

export interface SerperResponse {
  organic?: SerperOrganicItem[];
}

export interface AgentResearchResult {
  researchSummary: string;
  scrapedImages: ScrapedImage[];
  referencedUrls: string[];
}

export interface AgentWriterOutput {
  article: string;
  heroPrompt: string;
  researchSummary: string;
}

export interface GenerateBlogAgentOutput extends AgentWriterOutput {
  heroImageUrl: string | null;
}

export interface BrowserBaseSessionWS {
  ws_url?: string;
  live_urls?: {
    ws?: string;
  };
}

export interface AgentGenerateOutput {
  article: string;
  heroImageUrl: string | null;
  heroPrompt: string;
  researchSummary: string;
  usedUrls: string[];
}

export const ScrapedImageSchema = z.object({
  url: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const BlogAgentOutputSchema = z.object({
  article: z.string(),
  heroImagePrompt: z.string(),
  scrapedImages: z.array(ScrapedImageSchema),
  referencedUrls: z.array(z.string()),
});
