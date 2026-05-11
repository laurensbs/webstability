import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

export type BlogPost = {
  slug: string;
  locale: "nl" | "es";
  title: string;
  description: string;
  date: string;
  author: string;
  readingMinutes: number;
  content: string;
  /** SEO-keywords uit de frontmatter; ook gebruikt om "related posts"
   * te vinden (posts die ≥1 keyword delen). */
  keywords: string[];
  /** Optionele topic-tags voor clustering/filtering (frontmatter). */
  tags: string[];
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

async function readPostFile(locale: "nl" | "es", filename: string): Promise<BlogPost> {
  const fullPath = path.join(BLOG_DIR, locale, filename);
  const raw = await fs.readFile(fullPath, "utf8");
  const { data, content } = matter(raw);
  const slug = filename.replace(/\.mdx?$/, "");
  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  return {
    slug,
    locale,
    title: data.title,
    description: data.description,
    date: data.date,
    author: data.author ?? "Laurens Bos",
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    content,
    keywords: toStringArray(data.keywords),
    tags: toStringArray(data.tags),
  };
}

export async function listPosts(locale: "nl" | "es"): Promise<BlogPost[]> {
  const dir = path.join(BLOG_DIR, locale);
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  const mdx = files.filter((f) => f.endsWith(".mdx"));
  const posts = await Promise.all(mdx.map((f) => readPostFile(locale, f)));
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(locale: "nl" | "es", slug: string): Promise<BlogPost | null> {
  try {
    return await readPostFile(locale, `${slug}.mdx`);
  } catch {
    return null;
  }
}
