import { db } from "@/src/db";
import { blogs } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function getBlogByIdServer(id: string) {
  const [blog] = await db.select().from(blogs).where(eq(blogs.id, id)).limit(1);

  return blog ?? null;
}
