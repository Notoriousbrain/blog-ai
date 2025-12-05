import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const blogs = pgTable(
  "blogs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),

    title: text("title").notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    content: text("content").notNull(),

    excerpt: text("excerpt"),
    heroImage: text("hero_image"),

    status: varchar("status", { length: 20 }).default("draft").notNull(),
  
    metadata: jsonb("metadata").default({}),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    publishedAt: timestamp("published_at"),
  },
  (table) => ({
    slugIdx: index("blogs_slug_idx").on(table.slug),
  })
);

export const blogSources = pgTable("blog_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  blogId: uuid("blog_id")
    .notNull()
    .references(() => blogs.id, { onDelete: "cascade" }),

  type: varchar("type", { length: 20 }).notNull(),
  sourceUrl: text("source_url"),
  rawContent: text("raw_content"),
  metadata: jsonb("metadata").default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogImages = pgTable("blog_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  blogId: uuid("blog_id")
    .notNull()
    .references(() => blogs.id, { onDelete: "cascade" }),

  imageUrl: text("image_url").notNull(),
  prompt: text("prompt"),
  alt: text("alt"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogVersions = pgTable("blog_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  blogId: uuid("blog_id")
    .notNull()
    .references(() => blogs.id, { onDelete: "cascade" }),

  versionNumber: varchar("version_number", { length: 20 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blogRelations = relations(blogs, ({ many }) => ({
  sources: many(blogSources),
  images: many(blogImages),
  versions: many(blogVersions),
}));

export const blogsourcesRelations = relations(blogSources, ({ one }) => ({
  blog: one(blogs, {
    fields: [blogSources.blogId],
    references: [blogs.id],
  }),
}));
