import { http } from "@/src/lib/axios";
import type { BlogDetail, CreateBlogPayload } from "./types";

export async function createBlogClient(
  payload: CreateBlogPayload
): Promise<BlogDetail> {
  const res = await http.post("/api/blogs/create", payload);
  return res.data as BlogDetail;
}

export async function getBlogById(id: string): Promise<BlogDetail> {
  const res = await http.get(`/api/blogs/${id}`);
  return res.data as BlogDetail;
}
