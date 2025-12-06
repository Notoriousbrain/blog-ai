import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { slugify } from "@/src/lib/slugify";
import { db } from "@/src/db";
import { blogs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { http } from "@/src/lib/axios";
import { createDraftBlogRecord } from "@/src/services/server/blog/create-draft-blog-record";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const draft = await createDraftBlogRecord({
      userId: session.user.id,
      title: body.title,
      slug: slugify(body.title),
      urls: body.urls ?? [],
      rawText: body.rawText ?? "",
      tags: body.tags ?? [],
      category: body.category ?? "",
    });

    await db
      .update(blogs)
      .set({ status: "generating" })
      .where(eq(blogs.id, draft.id));

    const origin = new URL(req.url).origin;

    http
      .post(
        `${origin}/api/blogs/generate`,
        { blogId: draft.id },
        { timeout: 0 }
      )
      .catch((err) => console.error("BACKGROUND GENERATE ERROR:", err));

    return NextResponse.json(draft);
  } catch (err) {
    console.error("CREATE BLOG ERROR:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(err) },
      { status: 500 }
    );
  }
}
