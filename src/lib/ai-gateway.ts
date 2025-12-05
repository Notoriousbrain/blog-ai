import { generateText } from "ai";
import { createGateway } from "@ai-sdk/gateway";

export type ChatMessageType = {
  role: "system" | "user" | "assistant";
  content: string;
};

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://ai-gateway.vercel.sh/v1/ai",
});

const chatModel = "anthropic/claude-opus-4.5";
const imageModel = "google/gemini-2.5-flash-image";

export async function aiGatewayChat(messages: ChatMessageType[]) {
  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");

  const result = await generateText({
    model: gateway(chatModel),
    prompt,
    temperature: 0.8,
  });

  return result.text;
}

export async function aiGatewayImage(prompt: string) {
  const result = await generateText({
    model: gateway(imageModel),
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
