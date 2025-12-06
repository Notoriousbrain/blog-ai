import Image from "next/image";
import Link from "next/link";
import Header from "../components/header";
import { getAllBlogsServer } from "../services/server/blog/get-all-blogs";

export default async function Home() {
  const blogs = await getAllBlogsServer();

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-semibold mb-8">Latest Blogs</h1>

        {blogs.length === 0 ? (
          <p className="text-muted-foreground">No blogs published yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {blogs.map((b) => (
              <Link
                key={b.id}
                href={`/blog/${b.id}`}
                className="border rounded-lg overflow-hidden hover:shadow-md transition"
              >
                {b.heroImage ? (
                  <div className="relative h-[350px]">
                    <Image
                      src={b.heroImage}
                      alt={b.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100" />
                )}

                <div className="p-4">
                  <h2 className="font-medium text-lg mb-1">{b.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {b.excerpt || "No excerpt available."}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
