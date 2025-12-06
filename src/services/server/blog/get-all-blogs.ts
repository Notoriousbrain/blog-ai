import { db } from "@/src/db";
import { blogs } from "@/src/db/schema";
import { desc } from "drizzle-orm";

export async function getAllBlogsServer() {
  return db
    .select({
      id: blogs.id,
      title: blogs.title,
      excerpt: blogs.excerpt,
      heroImage: blogs.heroImage,
      createdAt: blogs.publishedAt,
    })
    .from(blogs)
    .orderBy(desc(blogs.publishedAt));
}
