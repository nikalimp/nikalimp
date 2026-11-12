import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";

// База стартапов: Library/Startups/startups.json в vault NikitOS (собирает scripts/startups-import.mjs из выгрузки Product Radar).
// Короткие ключи — чтобы /startups/data.json для поиска в браузере весил меньше.
export type Startup = {
  s: string; // slug карточки на Product Radar
  n: string; // название
  t: string; // слоган
  w?: string; // сайт проекта
  c: string[]; // категории
  st: string[]; // статусы: ищет инвестиции, продаётся, закрыт…
  f?: boolean; // есть бесплатные опции
  p?: string; // цена со слов команды: «Бесплатно», «Есть бесплатные опции», «Платно»
  city?: string;
  d?: string; // дата публикации на Product Radar, YYYY-MM-DD
  v: number; // голоса
};
export type StartupCategory = { slug: string; name: string; parent?: string; count: number };
export type StartupStatus = { code: string; name: string; count: number };
export type StartupBase = { source: string; updated: string; year?: string; categories: StartupCategory[]; statuses: StartupStatus[]; items: Startup[] };

const file = path.join(process.cwd(), "../Library/Startups/startups.json");
let cache: StartupBase | null = null;
export function getStartupBase(): StartupBase {
  if (cache) return cache;
  if (!fs.existsSync(file)) return (cache = { source: "https://productradar.ru", updated: "", categories: [], statuses: [], items: [] });
  return (cache = JSON.parse(fs.readFileSync(file, "utf8")));
}

// Страница проекта: Library/Startups/projects/<slug>.md — свой текст (лид, «Для кого», «Какую задачу решает», «Возможности», «Частые вопросы»).
// Без файла у проекта нет страницы и карточка в каталоге не ссылается никуда.
// Ссылка на сайт проекта по умолчанию nofollow; «follow: true» в frontmatter — открытая ссылка для проверенных проектов (по просьбе фаундера).
export type StartupPage = { title: string; description: string; body: string; faq: { q: string; a: string }[]; words: number; follow: boolean };
const pagesDir = path.join(process.cwd(), "../Library/Startups/projects");
let pages: Map<string, StartupPage> | null = null;
function loadPages() {
  if (pages) return pages;
  pages = new Map();
  if (!fs.existsSync(pagesDir)) return pages;
  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(pagesDir, f), "utf8");
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) continue;
    const meta: Record<string, string> = {};
    for (const line of m[1].split("\n")) { const i = line.indexOf(":"); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, ""); }
    const body = m[2].trim();
    const faqPart = body.split(/^## Частые вопросы\s*$/m)[1] ?? "";
    const faq = faqPart.split(/^### /m).slice(1).map((b) => { const [q, ...a] = b.split("\n"); return { q: q.trim(), a: a.join(" ").replace(/\s+/g, " ").trim() }; }).filter((x) => x.q && x.a);
    pages.set(f.replace(/\.md$/, ""), { title: typograf(meta.title ?? ""), description: typograf(meta.description ?? ""), body: typograf(body), faq: faq.map((x) => ({ q: typograf(x.q), a: typograf(x.a) })), words: body.split(/\s+/).length, follow: meta.follow === "true" });
  }
  return pages;
}
export const getStartupPage = (slug: string) => loadPages().get(slug);
export const hasStartupPage = (slug: string) => loadPages().has(slug);
export const getStartupsWithPages = () => getStartupBase().items.filter((i) => hasStartupPage(i.s));

/** Похожие: сначала из той же узкой категории, потом из соседних. */
export function similarStartups(it: Startup, n = 6) {
  const b = getStartupBase();
  const score = (x: Startup) => x.c.filter((c) => it.c.includes(c)).length;
  return b.items.filter((x) => x.s !== it.s && hasStartupPage(x.s) && score(x) > 0).sort((a, z) => score(z) - score(a) || z.v - a.v).slice(0, n);
}

/** Проекты категории — для родительской вместе с дочерними. */
export function startupsIn(slug: string) {
  const b = getStartupBase();
  const kids = new Set([slug, ...b.categories.filter((c) => c.parent === slug).map((c) => c.slug)]);
  return b.items.filter((i) => i.c.some((c) => kids.has(c)));
}

// Отдельная страница категории — от 6 проектов: на меньшем списке страница выходит пустой
export const MIN_CATEGORY = 6;
export const getStartupCategoryPages = () => getStartupBase().categories.filter((c) => c.count >= MIN_CATEGORY);

export const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many;
