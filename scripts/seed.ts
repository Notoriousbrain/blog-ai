import { db } from "@/src/db";
import { blogs, blogSources } from "@/src/db/schema";
import { sql } from "drizzle-orm";
import { slugify } from "@/src/lib/slugify";

async function main() {
  console.log("🌱 Seeding database with dummy blogs...");

  await db
    .delete(blogs)
    .where(sql`${blogs.metadata}::jsonb ->> 'seed' = 'true'`)
    .catch(() => {});

  const demoBlogs = [
    {
      title: "The State of AI in 2025",
      excerpt:
        "A simple look into how AI is shaping tools, work, and everyday life.",
      heroImage:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
      content: `
AI is moving fast, but not always in the way people expect.  
In 2025, the shift is more practical: companies using small models,  
developers bundling AI into everyday tools, and less hype-driven chaos.

Here's a straightforward look at what's actually happening.
      `,
    },
    {
      title: "Why Everyone Is Building AI Tools Now",
      excerpt: "From solo developers to big companies—everyone wants in.",
      heroImage:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&q=80&w=1200",
      content: `
More people are building AI tools because it finally feels possible.  
You don't need a huge team or special hardware anymore.  
Just an idea, a good model, and some patience.

This is the real reason the AI builder boom is happening.
      `,
    },
    {
      title: "How Small Teams Compete in the AI Age",
      excerpt: "You don't need a massive company to ship meaningful AI.",
      heroImage:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200",
      content: `
Small teams have a real advantage now.  
Large companies move slow, deal with approval layers,  
and struggle to take risks.

Meanwhile, 2-3 person teams can ship full AI products in weeks.  
This is how they stay ahead.
      `,
    },
  ];

  for (const blog of demoBlogs) {
    const [row] = await db
      .insert(blogs)
      .values({
        userId: "seed-user",
        title: blog.title,
        slug: slugify(blog.title),
        excerpt: blog.excerpt,
        content: blog.content,
        heroImage: blog.heroImage,
        status: "published",
        publishedAt: new Date(),
        metadata: { seed: true },
      })
      .returning();

    await db.insert(blogSources).values({
      blogId: row.id,
      type: "text",
      rawContent: "Seeded demo content",
    });
  }

  console.log("🌱 Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
