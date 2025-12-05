import BlogForm from "@/src/components/blog/blog-form";
import Header from "@/src/components/header";

export default function CreateBlogPage() {
  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-semibold mb-8">Create New Blog</h1>
        <BlogForm />
      </div>
    </>
  );
}
