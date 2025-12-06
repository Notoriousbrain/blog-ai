import { tool } from "ai";
import { z } from "zod";
import playwright from "playwright-core";
import BrowserBase from "@browserbasehq/sdk";

import { normalizeExtractedText } from "./normalize-text";

const browserbase = new BrowserBase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
});

interface BrowserBaseSessionWS {
  ws_url?: string;
  live_urls?: {
    ws?: string;
  };
  id?: string;
}

export const scrapeBrowserTool = tool({
  description: "Scrape a webpage via BrowserBase",
  inputSchema: z.object({
    url: z.string(),
  }),

  execute: async ({ url }) => {
    try {
      const session = await browserbase.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
      });

      const sessionWS = session as BrowserBaseSessionWS;

      const wsUrl = sessionWS.ws_url || sessionWS.live_urls?.ws || null;
      if (!wsUrl) return null;

      const browser = await playwright.chromium.connect(wsUrl);
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      const scraped = await page.evaluate(() => {
        const getText = (sel: string) =>
          Array.from(document.querySelectorAll(sel))
            .map((el) => (el as HTMLElement).innerText)
            .join("\n");

        const images = Array.from(document.querySelectorAll("img"))
          .map((img) => {
            return (
              img.src ||
              img.getAttribute("data-src") ||
              img.getAttribute("data-lazy-src")
            );
          })
          .filter((src) => src && src.length > 5)
          .filter((src) => !src?.startsWith("data:")); 

        return {
          text:
            getText("article") ||
            getText("main") ||
            document.body.innerText ||
            "",
          images,
        };
      });

      const cleanedText = normalizeExtractedText(scraped.text);
      const title = await page.title();

      const metaDesc = await page.evaluate(() => {
        return (
          document
            .querySelector("meta[name='description']")
            ?.getAttribute("content") || ""
        );
      });

      const finalText =
        cleanedText.length > 40
          ? cleanedText
          : metaDesc.length > 20
          ? metaDesc
          : "";

      await browser.close();

      if (!finalText) {
        return { error: "SCRAPE_FAILED" };
      }

      return {
        url,
        title,
        text: finalText,
        images: scraped.images,
      };
    } catch (err) {
      console.error("SCRAPE ERROR:", err);
      return null;
    }
  },
});
