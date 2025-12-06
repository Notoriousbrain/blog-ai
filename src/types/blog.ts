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

export type ChatMessageType = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type BlogRow = typeof blogs.$inferSelect;
export type BlogSourceRow = typeof blogSources.$inferSelect;

export interface AgentResearchPlan {
  searchQueries: string[];
  extraUrls: string[];
}
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchWebResponse {
  results: SearchResult[];
}
