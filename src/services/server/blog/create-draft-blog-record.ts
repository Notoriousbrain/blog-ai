import { db } from "@/src/db";
import { blogs, blogSources } from "@/src/db/schema";

import type { CreateBlogInputType } from "@/src/types";
import { like } from "drizzle-orm";

async function slugifyUnique(baseSlug: string): Promise<string> {
  // Check if base slug already exists
  const existing = await db
    .select({ slug: blogs.slug })
    .from(blogs)
    .where(like(blogs.slug, `${baseSlug}%`));

  if (existing.length === 0) return baseSlug;

  // Extract numbers: runable-1, runable-2, etc.
  const takenSlugs = new Set(existing.map((b) => b.slug));

  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;

  while (takenSlugs.has(newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }

  return newSlug;
}

export async function createDraftBlogRecord(input: CreateBlogInputType) {
  const { userId, title, slug, urls, rawText, tags, category } = input;

  const finalSlug = await slugifyUnique(slug);

  const metadata = {
    initialUrls: urls,
    initialRawText: rawText,
    tags,
    category,
  };

  const [blog] = await db
    .insert(blogs)
    .values({
      userId,
      title,
      slug: finalSlug,
      content: "",
      status: "draft",
      metadata,
    })
    .returning();

  if (!blog) {
    throw new Error("Failed to create blog draft");
  }

  if (urls && urls.length > 0) {
    for (const url of urls) {
      if (!url) continue;

      await db.insert(blogSources).values({
        blogId: blog.id,
        type: "url",
        sourceUrl: url,
      });
    }
  }

  if (rawText && rawText.trim().length > 0) {
    await db.insert(blogSources).values({
      blogId: blog.id,
      type: "text",
      rawContent: rawText.trim(),
    });
  }

  return blog;
}
