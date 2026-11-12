import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";

/**
 * Дайджест — недельные подборки сюжетов из ленты кабинета с комментарием Ника.
 * Файлы content/digest/<год>-w<неделя>.md собирает scripts/digest-build.mjs из .dashboard/news/picks.json
 * (GitHub Actions, понедельник). Файл можно править руками: сборщик не перезаписывает готовый выпуск.
 */
export type Digest = { slug: string; title: string; description: string; date: string; week: string; count: number; body: string };

const dir = path.join(process.cwd(), "content/digest");

function parse(file: string): Digest {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Нет frontmatter: ${file}`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return {
    slug: file.replace(/\.md$/, ""),
    title: typograf(meta.title),
    description: typograf(meta.description),
    date: meta.date,
    week: meta.week ?? "",
    count: Number(meta.count ?? 0),
    body: typograf(m[2].trim()),
  };
}

export function getDigests(): Digest[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map(parse).sort((a, b) => b.date.localeCompare(a.date));
}

export function getDigest(slug: string): Digest | undefined {
  return getDigests().find((d) => d.slug === slug);
}
