import { db } from "@/src/db";
import { blogs, blogSources, blogImages, blogVersions } from "@/src/db/schema";
import { aiGatewayChat, aiGatewayImage } from "@/src/lib/ai-gateway";
import { CreateBlogInputType } from "@/src/types";
import { desc, eq } from "drizzle-orm";

export async function createDraftBlogRecord(input: CreateBlogInputType) {
  const [blog] = await db
    .insert(blogs)
    .values({
      userId: input.userId,
      title: input.title,
      slug: input.slug,
      content: "",
      status: "draft",
      metadata: {
        initialUrls: input.urls,
        initialRawText: input.rawText,
      },
    })
    .returning();

  for (const url of input.urls) {
    await db.insert(blogSources).values({
      blogId: blog.id,
      type: "url",
      sourceUrl: url,
    });
  }

  if (input.rawText) {
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

export async function getBlogByIdServer(id: string) {
  const [blog] = await db.select().from(blogs).where(eq(blogs.id, id)).limit(1);

  return blog;
}

async function extractFromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return "";

    const html = await res.text();

    const cleaned = await aiGatewayChat([
      {
        role: "system",
        content: "Extract readable text from messy HTML.",
      },
      {
        role: "user",
        content: `Remove ads, UI, scripts. Keep only the main text. HTML:\n${html}`,
      },
    ]);

    return cleaned.trim();
  } catch {
    return "";
  }
}

async function collectSourceMaterial(blogId: string) {
  const rows = await db
    .select()
    .from(blogSources)
    .where(eq(blogSources.blogId, blogId));

  let out = "";

  for (const s of rows) {
    if (s.type === "url" && s.sourceUrl) {
      const text = await extractFromUrl(s.sourceUrl);
      if (text) out += `\nSOURCE (${s.sourceUrl}):\n${text}\n`;
    } else if (s.type === "text" && s.rawContent) {
      out += `\nNOTES:\n${s.rawContent}\n`;
    }
  }

  return out.slice(0, 15000);
}

async function humanRewriteLoop(content: string) {
  let current = content;
  let pass = 0;

  while (pass < 4) {
    const rewritten = await aiGatewayChat([
      {
        role: "system",
        content: "Rewrite text so it reads like a normal person wrote it.",
      },
      {
        role: "user",
        content: `Rewrite the article with these rules:
                    - No em dashes.
                    - No "However", "Moreover", "In addition", "Therefore".
                    - Use simple everyday English.
                    - Use only short and medium sentences.
                    - Do not repeat structures.
                    - Remove generic filler.
                    - Keep the meaning.

                    Return JSON like:
                    {
                      "text": "...",
                      "score": 1-10
                    }

                    ARTICLE:${current}
                  `.trim(),
      },
    ]);

    let updated = current;
    let score = 5;

    try {
      const parsed = JSON.parse(rewritten);
      updated = parsed.text ?? updated;
      score = Number(parsed.score);
    } catch {
      updated = rewritten;
    }

    current = updated;

    if (score >= 8) break;
    pass++;
  }

  return current;
}

async function generateReadableBlog(params: {
  title: string;
  sources: string;
}) {
  const { title, sources } = params;

  const outlineRaw = await aiGatewayChat([
    {
      role: "system",
      content: "Create a simple outline for a clear.",
    },
    {
      role: "user",
      content: `Write an outline. Keep it simple (3-7 sections).
                Title: ${title}

                Source material: ${sources}

                Return JSON: { "outline": ["...", "..."] }
      `.trim(),
    },
  ]);

  let outline: string[] = [];

  try {
    const parsed = JSON.parse(outlineRaw);
    outline = Array.isArray(parsed.outline) ? parsed.outline : [];
  } catch {
    outline = outlineRaw.split("\n").filter(Boolean).slice(0, 5);
  }

  const draft = await aiGatewayChat([
    {
      role: "system",
      content: "Write like a normal human, not an AI.",
    },
    {
      role: "user",
      content: `Topic: ${title}
                
                Outline: ${outline.map((x, i) => `${i + 1}. ${x}`).join("\n")}
                
                Source: ${sources}
                
                Write a natural, simple article. No title. No metadata.
      `.trim(),
    },
  ]);

  return humanRewriteLoop(draft.trim());
}

export async function generateBlogForId(blogId: string) {
  const [blog] = await db.select().from(blogs).where(eq(blogs.id, blogId));

  if (!blog) throw new Error("Blog not found");

  const sources = await collectSourceMaterial(blogId);

  const finalArticle = await generateReadableBlog({
    title: blog.title,
    sources,
  });

  const heroPrompt = `Cinematic 16:9 photo that represents: ${blog.title}. No text, realistic, editorial style.`;
  const heroImageUrl = await aiGatewayImage(heroPrompt);

  await db.insert(blogVersions).values({
    blogId,
    versionNumber: "v1",
    content: finalArticle,
    metadata: {
      heroPrompt,
      heroImageUrl,
    },
  });

  await db
    .update(blogs)
    .set({
      content: finalArticle,
      heroImage: heroImageUrl ?? blog.heroImage,
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
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

  return finalArticle;
}
