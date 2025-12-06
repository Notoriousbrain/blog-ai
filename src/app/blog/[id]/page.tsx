import Header from "@/src/components/header";
import { getBlogByIdServer } from "@/src/services/server/blog/get-blog-by-id";
import Image from "next/image";
import { marked } from "marked";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blog = await getBlogByIdServer(id);

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <p className="text-muted-foreground">Blog not found.</p>
      </div>
    );
  }

  function formatBlogHtml(markdown: string) {
    return marked(markdown);
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-black transition mb-6"
        >
          <FaArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>

        <h1 className="text-4xl font-semibold mb-4">{blog.title}</h1>

        {blog.publishedAt && (
          <p className="text-sm text-muted-foreground mb-8">
            {new Date(blog.publishedAt).toLocaleDateString()}
          </p>
        )}

        {blog.heroImage && (
          <div className="relative w-full h-72 mb-10">
            <Image
              src={blog.heroImage}
              alt={blog.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}

        <article
          className="prose prose-neutral dark:prose-invert leading-relaxed prose-headings:font-semibold prose-headings:mt-10 prose-headings:mb-4 prose-img:rounded-lg [&>p]:text-[17px] [&>p]:leading-[1.7] [&>p]:mb-6 [&>p]:mt-6 [&>p]:text-balance mx-auto"
          dangerouslySetInnerHTML={{ __html: formatBlogHtml(blog.content) }}
        />
      </div>
    </>
  );
}
