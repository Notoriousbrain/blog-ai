import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { blogs } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params;

    const [blog] = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, id))
      .limit(1);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (err) {
    console.error("GET /api/blogs/[id] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
