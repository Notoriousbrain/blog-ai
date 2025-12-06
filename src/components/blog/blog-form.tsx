"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "../ui";
import { createBlogClient, getBlogById } from "@/src/services/client/blog";

export default function BlogForm() {
  const [urls, setUrls] = useState("");
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function pollStatus(id: string) {
    setGenerating(true);

    const check = async () => {
      const data = await getBlogById(id);
      if (data?.status === "published") {
        setGenerating(false);
        alert("Blog generated!");
        window.location.href = `/blog/${id}`;
      } else {
        setTimeout(check, 2000);
      }
    };

    check();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const urlList = urls
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const draft = await createBlogClient({
      title,
      urls: urlList,
      rawText,
      tags: tagList,
      category,
    });

    setLoading(false);

    pollStatus(draft.id);
  }

  return (
    <Card className="w-full max-w-3xl mx-auto border border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Create a New Blog
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-2">
            <Label className="font-medium">Title</Label>
            <Input
              placeholder="What is happening in AI right now?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Source URLs</Label>
            <Textarea
              placeholder={`One per line — the system will extract readable text.\nhttps://example.com/article-1\nhttps://example.com/article-2`}
              rows={4}
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional — leave blank if youre only using raw text.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Raw Notes / Text</Label>
            <Textarea
              placeholder="Paste any text, summaries, transcripts, notes, etc."
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-medium">Tags</Label>
              <Input
                placeholder="ai, future, automation"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma separated</p>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Category</Label>
              <Input
                placeholder="technology"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <Button
            disabled={loading || generating}
            className="w-full py-3 text-base"
          >
            {loading
              ? "Creating draft…"
              : generating
              ? "Generating article…"
              : "Create Blog"}
          </Button>
        </form>

        {generating && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            The AI is writing your blog… this usually takes 10-30 seconds.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
