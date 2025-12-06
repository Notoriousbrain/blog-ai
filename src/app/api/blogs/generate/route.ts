import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { blogs, blogImages, blogVersions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { generateBlog } from "@/src/services/server/agent";

export async function POST(req: Request) {
  try {
    const { blogId } = await req.json();

    if (!blogId) {
      return NextResponse.json({ error: "Missing blogId" }, { status: 400 });
    }

    const [blog] = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, blogId))
      .limit(1);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const result = await generateBlog(blog.title);

    const now = new Date();

    await db.insert(blogVersions).values({
      blogId,
      versionNumber: "v1",
      content: result.article,
      metadata: {
        heroImagePrompt: result.heroImagePrompt,
        referencedUrls: result.referencedUrls,
        scrapedImages: result.scrapedImages,
      },
    });

    await db
      .update(blogs)
      .set({
        content: result.article,
        heroImage:
          typeof result.heroImageUrl === "string"
            ? result.heroImageUrl
            : result.heroImageUrl?.url ?? null,
        status: "published",
        updatedAt: now,
        publishedAt: blog.publishedAt ?? now,
      })
      .where(eq(blogs.id, blogId));

    if (result.heroImageUrl) {
      await db.insert(blogImages).values({
        blogId,
        imageUrl:
          typeof result.heroImageUrl === "string"
            ? result.heroImageUrl
            : result.heroImageUrl.url,
        prompt: result.heroImagePrompt ?? null,
        alt: blog.title,
      });
    }

    return NextResponse.json({
      success: true,
      content: result.article,
    });
  } catch (err) {
    console.error("GENERATE BLOG ERROR:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(err) },
      { status: 500 }
    );
  }
}
