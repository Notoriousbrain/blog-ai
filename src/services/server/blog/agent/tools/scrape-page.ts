import * as cheerio from "cheerio";
import { extractImagesFromHtml } from "./extract-images";
import { ScrapedPage } from "@/src/types";

const MAX_TEXT_LENGTH = 15000;

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      console.warn(`[scrapePage] Failed (${res.status}) for`, url);
      return null;
    }

    const html = await res.text();
    if (!html || html.length < 50) return null;

    return html;
  } catch (err) {
    console.error("[scrapePage] Network error", err);
    return null;
  }
}

function cleanText(text: string): string {
  if (!text) return "";

  const bannedPatterns = [
    /cookie/i,
    /subscribe/i,
    /newsletter/i,
    /accept/i,
    /advert/i,
    /privacy policy/i,
    /related articles/i,
  ];

  const cleaned = text.split("\n").filter((line) => {
    const l = line.trim();
    if (!l) return false;
    return !bannedPatterns.some((pat) => pat.test(l));
  });

  const deduped: string[] = [];
  for (const line of cleaned) {
    if (deduped[deduped.length - 1] !== line) deduped.push(line);
  }

  return deduped.join("\n").trim();
}

function extractStructuredArticle($: cheerio.CheerioAPI): string {
  let root = $("article").first();
  if (!root.length) root = $("main").first();
  if (!root.length) root = $("body");

  const lines: string[] = [];

  root.find("h1, h2, h3, h4, h5, h6, p").each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!text) return;

    if (tag.startsWith("h")) {
      parseInt(tag.replace("h", ""), 10);
      lines.push(`\n## ${text}\n`);
    } else if (tag === "p") {
      lines.push(text);
    }
  });

  let combined = lines.join("\n").trim();

  if (combined.length < 200) {
    combined = $("body").text().replace(/\s+/g, " ").trim();
  }

  return cleanText(combined);
}

export async function scrapePage(url: string): Promise<ScrapedPage | null> {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("meta[name='twitter:title']").attr("content")?.trim() ||
    $("title").text().trim() ||
    url;

  // 🧠 Extract high-quality article text
  const structuredText = extractStructuredArticle($);

  if (!structuredText || structuredText.length < 40) {
    console.warn("[scrapePage] Extracted text too short for", url);

    const imgs = extractImagesFromHtml(html, url);
    if (imgs.length > 0) {
      return {
        url,
        title,
        text: "",
        images: imgs,
      };
    }
    return null;
  }

  const images = extractImagesFromHtml(html, url);

  return {
    url,
    title,
    text: structuredText.slice(0, MAX_TEXT_LENGTH),
    images,
  };
}
