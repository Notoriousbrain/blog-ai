import Header from "@/src/components/header";
import { getBlogByIdServer } from "@/src/services/server/blog";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default async function BlogPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const blog = await getBlogByIdServer(id);

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <p className="text-muted-foreground">Blog not found.</p>
      </div>
    );
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
          className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>
    </>
  );
}
