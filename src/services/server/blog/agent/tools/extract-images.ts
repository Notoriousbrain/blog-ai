import { ScrapedImage } from "@/src/types";
import * as cheerio from "cheerio";

function absolute(base: string, src: string): string {
  if (!src) return "";
  return src.startsWith("http") ? src : new URL(src, base).toString();
}

export function extractImagesFromHtml(
  html: string,
  baseUrl: string
): ScrapedImage[] {
  const $ = cheerio.load(html);
  const images: ScrapedImage[] = [];

  $("img").each((_, el) => {
    const element = $(el);

    const candidates = [
      element.attr("src"),
      element.attr("data-src"),
      element.attr("data-original"),
      element.attr("data-lazy"),
      element.attr("data-image"),
    ].filter(Boolean);

    const srcset = element.attr("srcset");
    if (srcset) {
      const parts = srcset.split(",").map((s) => s.trim());
      const largest = parts.pop();
      if (largest) {
        const urlPart = largest.split(" ")[0];
        candidates.push(urlPart);
      }
    }

    for (const candidate of candidates) {
      if (!candidate) continue;
      const url = absolute(baseUrl, candidate);
      if (!url) continue;

      images.push({
        url,
        width: Number(element.attr("width")) || undefined,
        height: Number(element.attr("height")) || undefined,
      });
      break;
    }
  });

  $("picture source").each((_, el) => {
    const srcset = $(el).attr("srcset");
    if (!srcset) return;

    const largest = srcset.split(",").pop()?.trim().split(" ")[0];
    if (largest) {
      images.push({ url: absolute(baseUrl, largest) });
    }
  });

  const ogImage =
    $("meta[property='og:image']").attr("content") ||
    $("meta[name='twitter:image']").attr("content");

  if (ogImage) images.push({ url: absolute(baseUrl, ogImage) });

  const linkImage = $("link[rel='image_src']").attr("href");
  if (linkImage) images.push({ url: absolute(baseUrl, linkImage) });

  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr("style");
    if (!style) return;

    const match = style.match(/url\(["']?(.*?)["']?\)/i);
    if (match) {
      images.push({ url: absolute(baseUrl, match[1]) });
    }
  });

  const seen = new Set<string>();
  return images.filter((img) => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });
}
