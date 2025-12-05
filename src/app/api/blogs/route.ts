import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { blogs } from "@/src/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db
      .select({
        id: blogs.id,
        title: blogs.title,
        excerpt: blogs.excerpt,
        heroImage: blogs.heroImage,
        createdAt: blogs.publishedAt,
      })
      .from(blogs)
      .orderBy(desc(blogs.publishedAt));

    return NextResponse.json(all);
  } catch (err) {
    console.error("GET /api/blogs error", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
