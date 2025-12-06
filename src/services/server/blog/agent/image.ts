// src/services/server/blog/agent/image.ts
import { aiGatewayImage } from "@/src/lib/ai-gateway";
import { ScrapedImage } from "@/src/types";

export async function resolveHeroImage(params: {
  scrapedImages: ScrapedImage[];
  heroPrompt: string;
  articleContent: string;
}): Promise<string | null> {
  const { scrapedImages, heroPrompt, articleContent } = params;

  if (scrapedImages.length > 0) {
    const candidate = scrapedImages.find((img) => !!img.url);
    if (candidate) return candidate.url;
  }

  const prompt =
    heroPrompt ||
    `Create a realistic editorial-style photograph (not AI-looking) that visually represents the following article:

${articleContent.slice(0, 600)}

Rules:
- Must look like a real photograph, not AI artwork
- No surreal lighting or fantastical colors
- Avoid cinematic, anime, or overly dramatic styles
- Neutral color tones, natural lighting
- Looks like it could appear in a newspaper or National Geographic
- No text, no graphics
- Horizontal layout, 16:9 aspect ratio
- Avoid perfect symmetry or over-sharpened details
`;

  return aiGatewayImage(prompt);
}
