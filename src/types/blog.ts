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