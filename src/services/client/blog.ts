import { http } from "@/src/lib/axios";

export async function createBlogClient(payload: {
  title: string;
  urls: string[];
  rawText: string;
  tags: string[];
  category: string;
}) {
  const res = await http.post("/api/blogs/create", payload);
  return res.data;
}

export async function getBlogById(id: string) {
  const res = await http.get(`/api/blogs/${id}`);
  return res.data;
}
