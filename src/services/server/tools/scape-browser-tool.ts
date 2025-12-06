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

      const raw = await page.evaluate(() => {
        const getText = (sel: string) =>
          Array.from(document.querySelectorAll(sel))
            .map((el) => (el as HTMLElement).innerText)
            .join("\n");

        return (
          getText("article") || getText("main") || document.body.innerText || ""
        );
      });

      const cleaned = normalizeExtractedText(raw);
      const title = await page.title();

      const metaDesc = await page.evaluate(() => {
        return (
          document
            .querySelector("meta[name='description']")
            ?.getAttribute("content") || ""
        );
      });

      const text =
        cleaned.length > 40 ? cleaned : metaDesc.length > 20 ? metaDesc : "";

      await browser.close();

      if (!text) {
        return { error: "SCRAPE_FAILED" };
      }

      return { url, title, text };
    } catch {
      return null;
    }
  },
});
