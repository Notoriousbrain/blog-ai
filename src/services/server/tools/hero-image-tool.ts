import { tool } from "ai";
import { z } from "zod";
import { aiGatewayImage } from "@/src/lib/ai-gateway";

export const heroImageTool = tool({
  description: "Generate a hero image based on article content",
  inputSchema: z.object({
    prompt: z.string(),
  }),

  execute: async ({ prompt }) => {
    const enforcedPrompt = `
Create a high-quality, realistic, non-AI-looking hero image.

Requirements:
• No text inside the image.
• No watermarks.
• Photographic style preferred.
• Match the article theme.
• Avoid surreal/AI artifacts.

Theme: ${prompt}
`;

    try {
      const imageResult = await aiGatewayImage(enforcedPrompt);

      if (!imageResult) {
        console.error("❌ [heroImageTool] aiGatewayImage() returned NULL.");
        return null;
      }

      console.log(imageResult.substring(0, 200) + "...");

      return imageResult;
    } catch (err) {
      console.error("💥 [heroImageTool] ERROR during image generation:", err);

      if (err instanceof Promise) {
        console.error("🔍 [heroImageTool] Error is a Promise — awaiting...");
        const inner = await err.catch((e) => e);
        console.error("🔍 [heroImageTool] Unwrapped error:", inner);
      }

      return null;
    }
  },
});
