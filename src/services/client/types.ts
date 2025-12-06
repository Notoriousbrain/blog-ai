export interface CreateBlogPayload {
  title: string;
  urls: string[];
  rawText: string;
  tags: string[];
  category: string;
}

export interface BlogSummary {
  id: string;
  title: string;
  excerpt: string | null;
  heroImage: string | null;
  createdAt: string | null;
}

export interface BlogDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  heroImage: string | null;
  status: string;
  publishedAt: string | null;
}
