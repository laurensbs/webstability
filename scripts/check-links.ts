/**
 * Interne-link & content-health check. Draai met:
 *   pnpm tsx scripts/check-links.ts
 *
 * Wat het controleert:
 *  1. Alle interne markdown-links in content/blog/(nl|es)/*.mdx wijzen naar
 *     een bestaand publiek pad (marketing-routes uit i18n/routing.ts +
 *     blog-slugs + vertical-slugs + een paar altijd-geldige prefixes).
 *  2. Elke NL blog-post heeft een ES-tegenhanger en omgekeerd (op aantal —
 *     niet op exacte slug, want ES-slugs verschillen bewust). Puur een
 *     waarschuwing, geen harde fout.
 *  3. Frontmatter-sanity: title + description + date + ≥1 keyword aanwezig.
 *
 * Exit-code 1 als er kapotte links of ontbrekende frontmatter is, zodat dit
 * in CI of een pre-deploy-hook kan draaien (`pnpm check:links`). De
 * functies `auditBlogLinks()` / `auditFrontmatter()` zijn los exporteerbaar
 * mocht je ze ergens anders willen hergebruiken.
 */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { routing } from "../i18n/routing";
import { VERTICAL_SLUGS } from "../lib/verticals";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** Bouw de set van geldige publieke paden (zonder trailing slash, zonder #fragment). */
async function buildValidPaths(): Promise<Set<string>> {
  const valid = new Set<string>();

  // Marketing-routes uit i18n/routing.ts — zowel NL-canoniek als ES-variant.
  for (const [, def] of Object.entries(routing.pathnames)) {
    const add = (p: string) => {
      if (p.includes("[")) return; // dynamische segments slaan we hier over
      valid.add(p === "/" ? "/" : p.replace(/\/$/, ""));
    };
    if (typeof def === "string") {
      add(def);
      // ES gebruikt /es-prefix bovenop het canonieke pad als er geen aparte ES-slug is.
      add(def === "/" ? "/es" : `/es${def}`);
    } else {
      add(def.nl);
      add(`/es${def.es}`);
    }
  }

  // Verticals (gelijk slug-segment in beide locales).
  for (const slug of VERTICAL_SLUGS) {
    valid.add(`/diensten/${slug}`);
    valid.add(`/es/servicios/${slug}`);
  }

  // Blog-posts: één pad per slug per locale.
  for (const locale of ["nl", "es"] as const) {
    let files: string[] = [];
    try {
      files = await fs.readdir(path.join(BLOG_DIR, locale));
    } catch {
      /* geen map = geen posts */
    }
    for (const f of files) {
      if (!f.endsWith(".mdx")) continue;
      const slug = f.replace(/\.mdx$/, "");
      valid.add(locale === "nl" ? `/blog/${slug}` : `/es/blog/${slug}`);
    }
  }

  return valid;
}

/** Prefixes die altijd geldig zijn (dynamische routes die we niet enumereren). */
const ALWAYS_VALID_PREFIXES = ["/refer/", "/es/refer/", "/nps", "/es/nps"];

export type LinkIssue = { file: string; link: string; reason: string };

/** Scant alle blog-MDX en geeft een lijst kapotte interne links terug. */
export async function auditBlogLinks(): Promise<{ issues: LinkIssue[]; checked: number }> {
  const valid = await buildValidPaths();
  const issues: LinkIssue[] = [];
  let checked = 0;

  for (const locale of ["nl", "es"] as const) {
    const dir = path.join(BLOG_DIR, locale);
    let files: string[] = [];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const f of files) {
      if (!f.endsWith(".mdx")) continue;
      const raw = await fs.readFile(path.join(dir, f), "utf8");
      const { content } = matter(raw);
      // Markdown-links: [tekst](/pad) — alleen interne (begint met /, geen //).
      const linkRe = /\]\((\/[^)\s#]*)(?:#[^)\s]*)?\)/g;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(content)) !== null) {
        const link = m[1];
        if (link.startsWith("//")) continue; // protocol-relative, niet intern
        checked++;
        const normalized = link === "/" ? "/" : link.replace(/\/$/, "");
        if (valid.has(normalized)) continue;
        if (ALWAYS_VALID_PREFIXES.some((p) => normalized.startsWith(p))) continue;
        issues.push({ file: `${locale}/${f}`, link, reason: "geen bekend publiek pad" });
      }
    }
  }

  return { issues, checked };
}

/** Frontmatter-sanity + NL/ES-pariteit. Waarschuwingen + harde fouten gescheiden. */
export async function auditFrontmatter(): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts: Record<string, number> = { nl: 0, es: 0 };

  for (const locale of ["nl", "es"] as const) {
    const dir = path.join(BLOG_DIR, locale);
    let files: string[] = [];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const f of files) {
      if (!f.endsWith(".mdx")) continue;
      counts[locale]++;
      const raw = await fs.readFile(path.join(dir, f), "utf8");
      const { data } = matter(raw);
      const where = `${locale}/${f}`;
      if (!data.title) errors.push(`${where}: ontbrekende title`);
      if (!data.description) errors.push(`${where}: ontbrekende description`);
      if (!data.date) errors.push(`${where}: ontbrekende date`);
      const kw = Array.isArray(data.keywords) ? data.keywords : [];
      if (kw.length === 0) errors.push(`${where}: geen keywords in frontmatter`);
    }
  }

  if (counts.nl !== counts.es) {
    warnings.push(
      `NL/ES-pariteit: ${counts.nl} NL-posts vs ${counts.es} ES-posts — vertaal-backlog?`,
    );
  }

  return { errors, warnings };
}

// --- CLI-wrapper ---------------------------------------------------------

async function main() {
  const { issues, checked } = await auditBlogLinks();
  const { errors, warnings } = await auditFrontmatter();

  console.log(`Interne links gecontroleerd: ${checked}`);
  if (issues.length === 0) {
    console.log("✓ geen kapotte interne links");
  } else {
    console.log(`✗ ${issues.length} kapotte interne link(s):`);
    for (const i of issues) console.log(`  ${i.file} → ${i.link}  (${i.reason})`);
  }

  if (errors.length === 0) {
    console.log("✓ frontmatter compleet op alle posts");
  } else {
    console.log(`✗ ${errors.length} frontmatter-probleem(en):`);
    for (const e of errors) console.log(`  ${e}`);
  }

  for (const w of warnings) console.log(`⚠ ${w}`);

  const hardFail = issues.length > 0 || errors.length > 0;
  process.exit(hardFail ? 1 : 0);
}

// Alleen draaien als dit het entry-bestand is (niet bij import vanuit de cron).
if (process.argv[1] && process.argv[1].endsWith("check-links.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
