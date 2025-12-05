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
    visibility: varchar("visibility", { length: 20 })
      .default("public")
      .notNull(),

    readingTime: varchar("reading_time", { length: 20 }),
    wordCount: text("word_count"),

    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),

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

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
});

export const blogTags = pgTable("blog_tags", {
  blogId: uuid("blog_id")
    .notNull()
    .references(() => blogs.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
});

export const blogCategory = pgTable("blog_category", {
  blogId: uuid("blog_id")
    .notNull()
    .references(() => blogs.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
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
  tags: many(blogTags),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  blogs: many(blogTags),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  blogs: many(blogCategory),
}));

export const blogsourcesRelations = relations(blogSources, ({ one }) => ({
  blog: one(blogs, {
    fields: [blogSources.blogId],
    references: [blogs.id],
  }),
}));
