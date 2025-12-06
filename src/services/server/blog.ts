import { db } from "@/src/db";
import { blogs, blogSources, blogImages, blogVersions } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import type { BlogRow, CreateBlogInputType } from "@/src/types";
import { generateBlogWithAgent } from "./blog/agent/generate";

async function getUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;

  while (true) {
    const exists = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(eq(blogs.slug, slug))
      .limit(1);

    if (exists.length === 0) return slug;

    slug = `${base}-${counter}`;
    counter++;
  }
}

export async function createDraftBlogRecord(
  input: CreateBlogInputType
): Promise<BlogRow> {
  const uniqueSlug = await getUniqueSlug(input.slug);

  const [blog] = await db
    .insert(blogs)
    .values({
      userId: input.userId,
      title: input.title,
      slug: uniqueSlug,
      content: "",
      status: "draft",
      metadata: {
        initialUrls: input.urls,
        initialRawText: input.rawText,
        tags: input.tags ?? [],
        category: input.category ?? "",
      },
    })
    .returning();

  if (!blog) {
    throw new Error("Failed to create blog draft");
  }

  for (const url of input.urls) {
    if (!url) continue;
    await db.insert(blogSources).values({
      blogId: blog.id,
      type: "url",
      sourceUrl: url,
    });
  }

  if (input.rawText?.trim()) {
    await db.insert(blogSources).values({
      blogId: blog.id,
      type: "text",
      rawContent: input.rawText,
    });
  }

  return blog;
}

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

export async function getBlogByIdServer(
  id: string
): Promise<BlogRow | undefined> {
  const [blog] = await db.select().from(blogs).where(eq(blogs.id, id)).limit(1);

  return blog;
}

export async function generateBlogForId(blogId: string): Promise<string> {
  const [blog] = await db
    .select()
    .from(blogs)
    .where(eq(blogs.id, blogId))
    .limit(1);

  if (!blog) {
    throw new Error("Blog not found");
  }

  const { article, heroPrompt, heroImageUrl, researchSummary } =
    await generateBlogWithAgent(blog);

  await db.insert(blogVersions).values({
    blogId,
    versionNumber: "v1",
    content: article,
    metadata: {
      heroPrompt,
      heroImageUrl,
      researchSummary,
    },
  });

  const now = new Date();
  await db
    .update(blogs)
    .set({
      content: article,
      heroImage: heroImageUrl ?? blog.heroImage,
      status: "published",
      publishedAt: blog.publishedAt ?? now,
      updatedAt: now,
    })
    .where(eq(blogs.id, blog.id));

  if (heroImageUrl) {
    await db.insert(blogImages).values({
      blogId,
      imageUrl: heroImageUrl,
      prompt: heroPrompt,
      alt: blog.title,
    });
  }

  return article;
}
