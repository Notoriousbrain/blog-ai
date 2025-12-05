import { AxiosError } from "axios";
import { ChatMessageType } from "../types";
import { aiClient } from "./axios";

const apiUrl = process.env.AI_GATEWAY_URL || "";
const apiKey = process.env.AI_GATEWAY_API_KEY || "";
const imgUrl = process.env.AI_GATEWAY_IMAGE_URL || "";

const chatModel = "anthropic/claude-opus-4.5";
const imageModel = "google/gemini-3-pro-image";

export async function aiGatewayChat(messages: ChatMessageType[]) {
  if (!apiUrl || !apiKey) {
    throw new Error("AI Gateway environment variables not configured");
  }

  try {
    const res = await aiClient.post(apiUrl, {
      model: chatModel,
      messages,
      temperature: 0.85,
    });

    const content = res.data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      throw new Error("AI Gateway returned an empty response");
    }

    return content.trim();
  } catch (err: unknown) {
    console.error(
      "[AI Chat Error]",
      (err as AxiosError).response?.data || (err as AxiosError).message
    );
    throw new Error("AI chat request failed");
  }
}

export async function aiGatewayImage(prompt: string) {
  if (!imgUrl) return null;

  try {
    const res = await aiClient.post(imgUrl, {
      model: imageModel,
      prompt,
      size: "1024x1024",
    });

    const url = res.data?.data?.[0]?.url;
    return typeof url === "string" ? url : null;
  } catch (err: unknown) {
    console.error(
      "[AI Image Error]",
      (err as AxiosError).response?.data || (err as AxiosError).message
    );
    return null;
  }
}
