import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";

// Каталог инструментов читается прямо из vault NikitOS: Library/Tools.
// tools.csv — список (название, категория, подкатегория, рынок, буква, slug),
// affiliate.csv — партнёрские программы и мои реф-ссылки,
// <Инструмент>.md — заметка. На сайт попадают только инструменты с заполненным разделом «## Описание» и не из очереди publish-queue.txt.
// Индексация — по стандарту AI-Ready сайта: title 40–65 символов с брендом, description 120–160, текст от 250 слов.
// Ручной сниппет — раздел «## Сниппет» в заметке: «- Заголовок: …» (без « — NikAlimp») и «- Описание: …»; иначе собираются автоматически.

export type ToolRef = { name: string; slug: string };
export type RussiaStatus = "ok" | "vpn" | "card" | "vpn-card" | "blocked";
// Подписи статусов — в tool-parts.tsx (RUSSIA_LABEL). Коды латиницей: Типограф правит пробелы в русских строках исходников.
// Расширенная карточка (разделы «Карточка», «Вердикт», «Плюсы», «Минусы», «Тарифы», «Частые вопросы», «Вместе с»).
// Заполняется сначала у инструментов, которые получают переходы из поиска; у остальных блоки просто не показываются.
export type ToolCard = { russia?: RussiaStatus; ruLang?: string; free?: string; platforms: string[]; checked?: string };
export type ToolVerdict = { forWhom?: string; notFor?: string; summary?: string; rating?: string };
export type Tool = {
  name: string; slug: string; category: string; subcategory: string; subSlug: string; market: string; letter: string;
  body: string; short: string; price: string; russia: string;
  site: string; siteLabel: string; href: string; isRef: boolean;
  analogs: ToolRef[]; words: number; metaTitle: string; metaDescription: string;
  card: ToolCard; verdict: ToolVerdict; pros: string[]; cons: string[]; tariffs: string;
  faq: { q: string; a: string }[]; together: ToolRef[]; toc: { id: string; title: string }[]; rich: boolean;
};

function russiaCode(raw?: string): RussiaStatus | undefined {
  const v = (raw ?? "").toLowerCase();
  if (!v) return undefined;
  if (v.includes("не") && v.includes("работ")) return "blocked";
  if (v.includes("vpn") && v.includes("карт")) return "vpn-card";
  if (v.includes("vpn")) return "vpn";
  if (v.includes("карт")) return "card";
  if (v.includes("работ")) return "ok";
  return undefined;
}
const TR: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
export const slugify = (s: string) => [...s.toLowerCase()].map((c) => TR[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const headingId = (s: string) => slugify(s) || "section";
const listItems = (s: string) => s.split("\n").map((l) => l.match(/^\s*[-*]\s+(.+)/)?.[1]?.trim()).filter((x): x is string => !!x);
const kv = (s: string) => Object.fromEntries(listItems(s).map((l) => { const i = l.indexOf(":"); return i < 0 ? [l.replace(/[\s\u00a0]+/g, "").toLowerCase(), ""] : [l.slice(0, i).replace(/[\s\u00a0]+/g, "").toLowerCase(), l.slice(i + 1).trim()]; }));

export const TARGET_WORDS = 250;
const BRAND = " — NikAlimp";
const TITLE_MIN = 40, TITLE_MAX = 65, DESC_MIN = 120, DESC_MAX = 160;

function toolTitle(name: string) {
  const variants = [
    `${name}: что это, возможности, цены и аналоги`,
    `${name}: что это, возможности и аналоги`,
    `${name}: обзор и аналоги`,
    name,
  ];
  const len = (v: string) => (v + BRAND).length;
  return variants.find((v) => len(v) >= TITLE_MIN && len(v) <= TITLE_MAX) ?? variants.filter((v) => len(v) <= TITLE_MAX)[0] ?? name;
}

// description: первые целые предложения абзаца в пределах 120–160 символов; короткий дополняем хвостом.
// Обрезка по слову с многоточием — только если первое предложение само длиннее 160 символов.
function toolDescription(short: string) {
  const text = short.replace(/…$/, "").trim();
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map((x) => x.trim()) ?? [text];
  let d = "";
  for (const s of sentences) { const next = d ? `${d} ${s}` : s; if (next.length > DESC_MAX) break; d = next; }
  const tail = "Возможности, цены, работа из России и аналоги.";
  if (!d) return text.slice(0, text.lastIndexOf(" ", DESC_MAX - 1)).replace(/[,;:—–-]\s*$/, "") + "…";
  d = d.replace(/\.?$/, ".").replace(/([!?])\.$/, "$1");
  for (const t of [tail, "Цены и аналоги."]) if (d.length < DESC_MIN && (d + " " + t).length <= DESC_MAX) d = `${d} ${t}`;
  // Не хватило целых предложений до 120 символов — как раньше: хвост и обрезка по слову
  if (d.length < DESC_MIN) d = `${text.replace(/\.?$/, ".")} ${tail}`;
  if (d.length > DESC_MAX) d = d.slice(0, d.lastIndexOf(" ", DESC_MAX - 1)).replace(/[,;:—–-]\s*$/, "") + "…";
  return d;
}

const dir = path.join(process.cwd(), "..", "Library", "Tools");

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function readCsv(file: string) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return [];
  const [head, ...rows] = parseCsv(fs.readFileSync(p, "utf8").replace(/^﻿/, "")).filter((r) => r.length > 1);
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

// Имя файла заметки: как в vault (пять имён с пометкой «(инструмент)», без «:» и «/»)
const SPECIAL = new Set(["claude", "readme", "telegram", "tilda", "wordpress"]);
const fileName = (n: string) => n.replace(/:/g, "-").replace(/\//g, " ") + (SPECIAL.has(n.toLowerCase()) ? " (инструмент)" : "");
const section = (md: string, title: string) => md.match(new RegExp(`^## ${title.replace(/[\s\u00a0]+/g, "[\\s\\u00a0]+")}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m"))?.[1].trim() ?? "";
const stripMd = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b ?? a).replace(/[*_`#]/g, "").replace(/\s+/g, " ").trim();
const cleanName = (n: string) => n.replace(/ \(инструмент\)$/, "");

function normalizeUrl(s: string) {
  const m = s.match(/https?:\/\/\S+|[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?/i)?.[0];
  if (!m) return "";
  return (/^https?:/.test(m) ? m : `https://${m}`).replace(/[).,]+$/, "");
}

let cache: Tool[] | null = null;

export function getTools(): Tool[] {
  if (cache) return cache;
  const list = readCsv("tools.csv");
  const refs = new Map(readCsv("affiliate.csv").filter((r) => r["Моя реф-ссылка"]).map((r) => [r["Инструмент"], r["Моя реф-ссылка"]]));
  const raw = list.map((r) => {
    const name = r["Инструмент"];
    const file = path.join(dir, `${fileName(name)}.md`);
    const md = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    return {
      name, slug: r["Slug"], category: r["Категория"], subcategory: r["Подкатегория"], market: r["Рынок"], letter: r["Буква"],
      desc: section(md, "Описание"), siteRaw: section(md, "Сайт"), price: section(md, "Цена"), russia: section(md, "Доступность из России"),
      analogsRaw: section(md, "Аналоги"), ref: refs.get(name) ?? "",
      cardRaw: section(md, "Карточка"), verdictRaw: section(md, "Вердикт"), prosRaw: section(md, "Плюсы"), consRaw: section(md, "Минусы"),
      tariffsRaw: section(md, "Тарифы"), faqRaw: section(md, "Частые вопросы"), togetherRaw: section(md, "Вместе с"), snippetRaw: section(md, "Сниппет"),
    };
  });
  // Очередь публикации: описанные, но ещё не выпущенные инструменты (Library/Tools/publish-queue.txt)
  const queueFile = path.join(dir, "publish-queue.txt");
  const queue = new Set(fs.existsSync(queueFile) ? fs.readFileSync(queueFile, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")) : []);
  const published = raw.filter((t) => t.desc && !queue.has(t.name));
  // по названию и по имени файла заметки (shadcn/ui → «shadcn ui», 1С:Фреш → «1С-Фреш»)
  const bySlugName = new Map(published.flatMap((t) => [[t.name.toLowerCase(), t.slug], [cleanName(fileName(t.name)).toLowerCase(), t.slug]] as [string, string][]));
  const resolve = (n: string) => bySlugName.get(cleanName(n).toLowerCase());
  const wiki = (s: string) => s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, n: string, label?: string) => {
    const slug = resolve(n); const text = label ?? cleanName(n);
    return slug ? `[${text}](/tools/${slug}/)` : text;
  });
  cache = published.map((t) => {
    const analogs = [...t.analogsRaw.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)]
      .map((m) => ({ name: m[2] ?? cleanName(m[1]), slug: resolve(m[1]) }))
      .filter((x): x is ToolRef => !!x.slug && x.slug !== t.slug);
    const refsIn = (raw: string) => [...raw.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)]
      .map((m) => ({ name: m[2] ?? cleanName(m[1]), slug: resolve(m[1]) }))
      .filter((x): x is ToolRef => !!x.slug && x.slug !== t.slug);
    const c = kv(t.cardRaw), v = kv(t.verdictRaw), sn = kv(t.snippetRaw);
    const russiaStatus = russiaCode(c["россия"]);
    const card: ToolCard = { russia: russiaStatus, ruLang: c["русскийязык"], free: c["бесплатныйплан"], platforms: (c["платформы"] ?? "").split(",").map((x) => x.trim()).filter(Boolean), checked: c["проверено"] };
    const verdict: ToolVerdict = { forWhom: v["комуподходит"], notFor: v["комунеподходит"], summary: v["итог"], rating: v["оценка"] };
    const faq = t.faqRaw.split(/^###\s+/m).slice(1).map((b) => { const [q, ...a] = b.split("\n"); return { q: typograf(q.trim()), a: typograf(wiki(a.join("\n").trim())) }; }).filter((f) => f.q && f.a);
    const toc = [...t.desc.matchAll(/^###\s+(.+)$/gm)].map((m) => ({ id: headingId(stripMd(m[1])), title: typograf(stripMd(m[1])) }));
    const first = stripMd(t.desc.split(/\n\s*\n/)[0]);
    const words = stripMd([t.desc, t.price, t.russia, t.verdictRaw, t.prosRaw, t.consRaw, t.faqRaw].join(" ")).split(" ").filter(Boolean).length;
    const site = normalizeUrl(t.siteRaw);
    return {
      name: t.name, slug: t.slug, category: t.category, subcategory: t.subcategory, subSlug: slugify(t.subcategory), market: t.market, letter: t.letter,
      body: typograf(wiki(t.desc)), short: typograf(first.length > 220 ? first.slice(0, first.lastIndexOf(" ", 210)) + "…" : first),
      price: typograf(wiki(t.price)), russia: typograf(wiki(t.russia)),
      site, siteLabel: site.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), href: t.ref || site, isRef: !!t.ref,
      analogs, words, metaTitle: typograf(sn["заголовок"] || toolTitle(t.name)), metaDescription: typograf(sn["описание"] || toolDescription(first)),
      card, verdict, pros: listItems(t.prosRaw).map((x) => typograf(wiki(x))), cons: listItems(t.consRaw).map((x) => typograf(wiki(x))),
      tariffs: typograf(wiki(t.tariffsRaw)), faq, together: refsIn(t.togetherRaw), toc,
      rich: !!(t.cardRaw || t.verdictRaw || t.faqRaw),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "ru"));
  const short = cache.filter((t) => t.words < TARGET_WORDS);
  if (short.length) console.warn(`⚠ Инструменты: ${short.length} короче ${TARGET_WORDS} слов — дописать: ${short.map((t) => `${t.name} (${t.words})`).join(", ")}`);
  return cache;
}

export const getTool = (slug: string) => getTools().find((t) => t.slug === slug);

export function getToolCategories() {
  const map = new Map<string, Tool[]>();
  for (const t of getTools()) map.set(t.category, [...(map.get(t.category) ?? []), t]);
  return [...map.entries()].map(([name, tools]) => ({ name, tools })).sort((a, b) => b.tools.length - a.tools.length);
}

export function getToolLetters() {
  const ru = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ".split("");
  const en = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const used = new Set(getTools().map((t) => t.letter));
  const extra = [...used].filter((l) => !ru.includes(l) && !en.includes(l));
  return [...ru, ...en, ...extra].map((l) => ({ letter: l, active: used.has(l) }));
}

export function getSubcategories() {
  const map = new Map<string, { name: string; slug: string; category: string; tools: Tool[] }>();
  for (const t of getTools()) {
    const g = map.get(t.subSlug) ?? { name: t.subcategory, slug: t.subSlug, category: t.category, tools: [] };
    g.tools.push(t); map.set(t.subSlug, g);
  }
  return [...map.values()].filter((g) => g.slug && g.tools.length >= 6).sort((a, b) => b.tools.length - a.tools.length);
}

/** Пары «X vs Y»: оба инструмента с расширенной карточкой и один — аналог другого. */
export function getComparePairs() {
  const rich = new Map(getTools().filter((t) => t.rich).map((t) => [t.slug, t]));
  const seen = new Set<string>(); const pairs: { slug: string; a: Tool; b: Tool }[] = [];
  for (const a of rich.values()) for (const r of a.analogs) {
    const b = rich.get(r.slug); if (!b) continue;
    const [x, y] = [a, b].sort((p, q) => p.slug.localeCompare(q.slug)); const slug = `${x.slug}-vs-${y.slug}`;
    if (!seen.has(slug)) { seen.add(slug); pairs.push({ slug, a: x, b: y }); }
  }
  return pairs;
}

export const RUSSIA_OK = (s?: RussiaStatus) => s === "ok";
