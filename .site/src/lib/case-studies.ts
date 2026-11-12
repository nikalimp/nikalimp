import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";

// Подробные кейсы: content/cases/<slug>.md, картинки — public/cases/<slug>/.
// draft: true — черновик (проект ещё не запущен публично или нет согласия клиента), на сайт не попадает.
// Frontmatter — строки «ключ: значение»; metric и stage повторяются и рисуются как инфографика.
export type CaseMetric = { value: string; label: string };
export type CaseStage = { title: string; text: string };
export type CaseStudy = {
  slug: string; title: string; client: string; description: string; year: string; industry: string; type: string;
  status: string; phase?: string; site?: string; role: string; duration?: string; stack: string[]; cover?: string; order: number;
  metrics: CaseMetric[]; stages: CaseStage[]; body: string; words: number; draft: boolean;
};

const dir = path.join(process.cwd(), "content/cases");
const split = (s: string) => { const i = s.indexOf("|"); return i < 0 ? [s.trim(), ""] : [s.slice(0, i).trim(), s.slice(i + 1).trim()]; };

function parse(file: string): CaseStudy {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Нет frontmatter: ${file}`);
  const meta: Record<string, string> = {}; const metrics: CaseMetric[] = []; const stages: CaseStage[] = [];
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":"); if (i <= 0) continue;
    const key = line.slice(0, i).trim(); const val = line.slice(i + 1).trim().replace(/^"|"$/g, "");
    if (key === "metric") { const [value, label] = split(val); metrics.push({ value: typograf(value), label: typograf(label) }); }
    else if (key === "stage") { const [title, text] = split(val); stages.push({ title: typograf(title), text: typograf(text) }); }
    else meta[key] = val;
  }
  const body = m[2].trim();
  return {
    slug: file.replace(/\.md$/, ""), title: typograf(meta.title ?? ""), client: meta.client ?? "", description: typograf(meta.description ?? ""),
    year: meta.year ?? "", industry: typograf(meta.industry ?? ""), type: typograf(meta.type ?? ""), status: meta.status ?? "", phase: meta.phase ? typograf(meta.phase) : undefined,
    site: meta.site || undefined, role: typograf(meta.role ?? ""), duration: meta.duration ? typograf(meta.duration) : undefined,
    stack: (meta.stack ?? "").split(",").map((s) => s.trim()).filter(Boolean), cover: meta.cover || undefined, order: Number(meta.order ?? 99),
    draft: meta.draft === "true", metrics, stages, body: typograf(body), words: body.replace(/!\[[^\]]*\]\([^)]*\)/g, "").split(/\s+/).filter(Boolean).length,
  };
}

let cache: CaseStudy[] | null = null;
export function getCaseStudies(): CaseStudy[] {
  if (cache) return cache;
  if (!fs.existsSync(dir)) return (cache = []);
  return (cache = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map(parse).filter((c) => !c.draft).sort((a, b) => a.order - b.order || b.year.localeCompare(a.year)));
}
export const getCaseStudy = (slug: string) => getCaseStudies().find((c) => c.slug === slug);
