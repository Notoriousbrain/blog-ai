import { db } from "@/src/db";
import { blogs, blogSources, blogImages, blogVersions } from "@/src/db/schema";
import { aiGatewayChat, aiGatewayImage } from "@/src/lib/ai-gateway";
import { CreateBlogInputType } from "@/src/types";
import { desc, eq } from "drizzle-orm";

async function getUniqueSlug(base: string) {
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

export async function createDraftBlogRecord(input: CreateBlogInputType) {
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

  while (pass < 3) {
    const rewritten = await aiGatewayChat([
      {
        role: "system",
        content: "Rewrite text so it reads like a normal person wrote it.",
      },
      {
        role: "user",
        content: `Rewrite the article with these rules:
          - Expand the content to roughly **2x the original length**
          - Break it into **3-4 paragraphs**, each with solid size (3-5 sentences)
          - Use simple, everyday English
          - Avoid filler words and AI-sounding phrasing
          - No "However", "Moreover", "In addition", "Therefore"
          - No em dashes
          - Keep the original meaning, but explain ideas more fully
          - Improve transitions and readability
          - Add natural spacing between paragraphs
          - Return ONLY the rewritten article text. Do NOT return JSON

          ARTICLE:
          ${current}
          `.trim(),
      },
    ]);

    current = rewritten.trim();
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

  const heroPrompt = `Generate a cinematic 16:9 photograph representing this topic: "${blog.title}"

     Rules:
     - No text
     - Realistic
     - Editorial photography
     - Horizontal composition
     - aspect_ratio: 16:9
    `;

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
