import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { slugify } from "@/src/lib/slugify";
import { createDraftBlogRecord } from "@/src/services/server/blog";
import { db } from "@/src/db";
import { blogs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { http } from "@/src/lib/axios";

export async function POST(req: Request) {
  const session = await auth.api.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

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

  http.post("/api/blogs/generate", { blogId: draft.id }).catch(() => {});

  return NextResponse.json(draft);
}
