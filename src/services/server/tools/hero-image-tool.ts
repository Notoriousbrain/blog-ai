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

    return await aiGatewayImage(enforcedPrompt);
  },
});
