import { getInitialSourcesForBlog, runResearchPhase } from "./research";
import { writeArticleFromResearch } from "./writer";
import { resolveHeroImage } from "./image";
import { BlogRow, GenerateBlogAgentOutput } from "@/src/types";

export async function generateBlogWithAgent(
  blog: BlogRow
): Promise<GenerateBlogAgentOutput> {
  if (!blog.id) {
    throw new Error("Blog row is missing id");
  }

  const initial = await getInitialSourcesForBlog(blog.id);
  const research = await runResearchPhase({ blog, initial });
  const writerOutput = await writeArticleFromResearch({ blog, research });

  const heroImageUrl = await resolveHeroImage({
    scrapedImages: research.scrapedImages,
    heroPrompt: writerOutput.heroPrompt,
    articleContent: writerOutput.article,
  });

  return {
    article: writerOutput.article,
    heroPrompt: writerOutput.heroPrompt,
    researchSummary: writerOutput.researchSummary,
    heroImageUrl,
  };
}
