import { NextResponse } from "next/server";
import { generateBlogForId } from "@/src/services/server/blog";

export async function POST(req: Request) {
  const { blogId } = await req.json();

  if (!blogId) {
    return NextResponse.json({ error: "Missing blogId" }, { status: 400 });
  }

  const result = await generateBlogForId(blogId);

  return NextResponse.json({ success: true, content: result });
}
