import { generateText } from "ai";
import { createGateway } from "@ai-sdk/gateway";

export type ChatMessageType = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseURL: "https://ai-gateway.vercel.sh/v1/ai",
});

export const CHAT_MODEL_ID = "openai/gpt-4.1";
export const IMAGE_MODEL_ID = "google/gemini-2.5-flash-image";

export async function aiGatewayImage(prompt: string): Promise<string | null> {
  const result = await generateText({
    model: gateway(IMAGE_MODEL_ID),
    prompt,
  });

  const imageFiles = result.files.filter((f) =>
    f.mediaType?.startsWith("image/")
  );

  if (imageFiles.length === 0) return null;

  const file = imageFiles[0];
  const base64 = Buffer.from(file.uint8Array).toString("base64");

  return `data:${file.mediaType};base64,${base64}`;
}
