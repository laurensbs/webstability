import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

/**
 * Privé strategie-doc — losgekoppeld van de blog-pipeline. Leest één
 * MDX-bestand uit content/private/. Geen lijst, geen sitemap, geen
 * locale-routing.
 */
export type StrategieDoc = {
  title: string;
  lastUpdated: string;
  nextReview: string;
  version: number;
  content: string;
};

const DOC_PATH = path.join(process.cwd(), "content", "private", "strategie.mdx");

export async function readStrategieDoc(): Promise<StrategieDoc | null> {
  try {
    const raw = await fs.readFile(DOC_PATH, "utf8");
    const { data, content } = matter(raw);
    return {
      title: String(data.title ?? "Strategie"),
      lastUpdated: String(data.lastUpdated ?? ""),
      nextReview: String(data.nextReview ?? ""),
      version: Number(data.version ?? 1),
      content,
    };
  } catch {
    return null;
  }
}
