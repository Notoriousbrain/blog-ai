DROP TABLE "blog_category" CASCADE;--> statement-breakpoint
DROP TABLE "blog_tags" CASCADE;--> statement-breakpoint
DROP TABLE "categories" CASCADE;--> statement-breakpoint
DROP TABLE "tags" CASCADE;--> statement-breakpoint
ALTER TABLE "blogs" DROP COLUMN "visibility";--> statement-breakpoint
ALTER TABLE "blogs" DROP COLUMN "reading_time";--> statement-breakpoint
ALTER TABLE "blogs" DROP COLUMN "word_count";--> statement-breakpoint
ALTER TABLE "blogs" DROP COLUMN "seo_title";--> statement-breakpoint
ALTER TABLE "blogs" DROP COLUMN "seo_description";