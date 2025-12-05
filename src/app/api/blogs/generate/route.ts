import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { generateBlogForId } from "@/src/services/server/blog";

export async function POST(req: Request) {
  const session = await auth.api.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blogId } = await req.json();
  if (!blogId) {
    return NextResponse.json({ error: "Missing blogId" }, { status: 400 });
  }

  const result = await generateBlogForId(blogId);

  return NextResponse.json({ success: true, content: result });
}
