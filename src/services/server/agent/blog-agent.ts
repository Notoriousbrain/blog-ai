import { ToolLoopAgent, Output } from "ai";
import { searchWebTool } from "../tools/search-web-tool";
import { scrapeBrowserTool } from "../tools/scape-browser-tool";
import { heroImageTool } from "../tools/hero-image-tool";
import { BlogAgentOutputSchema } from "@/src/types";
import { aiGatewayImage } from "@/src/lib/ai-gateway";

export const blogAgent = new ToolLoopAgent({
  model: "anthropic/claude-opus-4.5",
  instructions: `
You are a research-grade blog writer.
You MUST use tools to gather real facts.
Never hallucinate. Never invent companies or details.
Always scrape the URLs you find. Always ground facts in scraped text.
`,
  tools: {
    searchWeb: searchWebTool,
    scrape: scrapeBrowserTool,
    heroImage: heroImageTool,
  },

  output: Output.object({
    schema: BlogAgentOutputSchema,
  }),
});

export async function generateBlog(title: string) {
  const { output } = await blogAgent.generate({
    prompt: `Write a full blog article about: "${title}".`,
  });

  let heroImageUrl = null;

  if (output.scrapedImages && output.scrapedImages.length > 0) {
    heroImageUrl = output.scrapedImages[0];
    console.log("📸 Using scraped image:", heroImageUrl);
  }

  if (!heroImageUrl) {
    console.log("⚠️ No scraped image → generating AI hero image...");

    const promptText =
      output.article && output.article.length > 40 ? output.article : title;

    heroImageUrl = await aiGatewayImage(
      `Photographic, realistic hero image representing: ${promptText}`
    );

    if (!heroImageUrl) {
      console.error("❌ AI gateway failed to return an image.");
    }
  }

  return {
    ...output,
    heroImageUrl,
  };
}
