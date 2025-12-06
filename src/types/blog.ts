import { blogs, blogSources } from "../db/schema";

export type CreateBlogInputType = {
  userId: string;
  title: string;
  urls: string[];
  rawText: string;
  tags: string[];
  category: string;
  slug: string;
};

export interface ScrapedImage {
  url: string;
  width?: number;
  height?: number;
}

export type ChatMessageType = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type BlogRow = typeof blogs.$inferSelect;
export type BlogSourceRow = typeof blogSources.$inferSelect;

export interface AgentInitialSources {
  urls: string[];
  notes: string;
}

export interface AgentResearchPlan {
  searchQueries: string[];
  extraUrls: string[];
}

export interface AgentResearchResult {
  researchSummary: string;
  referencedUrls: string[];
  scrapedImages: ScrapedImage[];
}

export interface AgentWriterOutput {
  article: string;
  heroPrompt: string;
  researchSummary: string;
}

export interface GenerateBlogAgentOutput extends AgentWriterOutput {
  heroImageUrl: string | null;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchWebResponse {
  results: SearchResult[];
}

export interface SerperOrganicItem {
  title?: unknown;
  link?: unknown;
  snippet?: unknown;
}
export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
  images: ScrapedImage[];
}
