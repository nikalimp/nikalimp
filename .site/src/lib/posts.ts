import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";
import { getTerms } from "./glossary";

// Ссылки на термины глоссария без опубликованного определения превращаем в обычный текст — без битых ссылок
function unlinkMissingTerms(md: string) {
  const published = new Set(getTerms().map((t) => t.slug));
  return md.replace(/\[([^\]]+)\]\(\/glossary\/([^/)#]+)\/?\)/g, (all, text: string, slug: string) => (published.has(slug) ? all : text));
}

// cover / coverAlt / rubric — необязательные поля frontmatter. Обложку и картинки статьи рисует scripts/media.mjs
// по спецификации content/media/<slug>.json (скилл /content), файлы лежат в public/blog/<slug>/.
export type Post = { slug: string; title: string; seoTitle?: string; description: string; date: string; updated?: string; cover?: string; coverAlt?: string; rubric?: string; body: string };

const dir = path.join(process.cwd(), "content/blog");

function parse(file: string): Post {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Нет frontmatter: ${file}`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  // Типограф при сборке: неразрывные пробелы, «ёлочки», тире — файлы статей не меняются
  return { slug: file.replace(/\.md$/, ""), title: typograf(meta.title), seoTitle: meta.seoTitle ? typograf(meta.seoTitle) : undefined, description: typograf(meta.description), date: meta.date, updated: meta.updated, cover: meta.cover || undefined, coverAlt: meta.coverAlt ? typograf(meta.coverAlt) : undefined, rubric: meta.rubric || undefined, body: typograf(unlinkMissingTerms(m[2].trim())) };
}

export function getPosts(): Post[] {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map(parse).sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
