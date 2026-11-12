import fs from "node:fs";
import path from "node:path";
import { typograf } from "./typograf.mjs";

// Глоссарий читается прямо из vault NikitOS: Library/Glossary.
// Все опубликованные термины индексируются. title и description собираются по стандарту AI-Ready сайта (§3):
// title 40–65 символов вместе с брендом (короткий термин дополняется расшифровкой и хвостом «что это такое простыми словами»),
// description 120–160 символов. Цель для текста определения — от 250 слов (см. words).
// glossary-terms.csv — список терминов (slug, английский, синонимы, категория),
// Термины/<Термин>.md — заметка. На сайт попадают только термины с заполненным разделом «## Определение».

export type TermRef = { term: string; slug: string };
export type Term = {
  term: string; en: string; expansion: string; synonyms: string[]; category: string; letter: string; slug: string;
  body: string; short: string; related: TermRef[];
  words: number; metaTitle: string; metaDescription: string;
};

export const TARGET_WORDS = 250; // ориентир для текста определения: короче — Google чаще оставляет страницу без индекса
const BRAND = " — NikAlimp"; // шаблон title из layout: «%s — NikAlimp»
const TITLE_MIN = 40, TITLE_MAX = 65, DESC_MIN = 120, DESC_MAX = 160;

// title термина: расшифровка + хвост, подбираем самый информативный вариант в пределах 40–65 символов.
// Расшифровка: колонка «Расшифровка» в CSV (русское название английского термина), иначе English (полная форма аббревиатуры), иначе синоним
function termTitle(term: string, expansion: string, en: string, synonyms: string[]) {
  const other = [expansion, en, ...synonyms].find((x) => x && x.toLowerCase() !== term.toLowerCase());
  const withEn = other ? `${term} (${other})` : term;
  const variants = [
    `${withEn} — что это такое простыми словами`, `${withEn} — что это такое`, `${withEn} — что это`, withEn,
    `${term} — что это такое простыми словами`, `${term} — что это такое`, `${term} — что это`,
  ];
  const len = (v: string) => (v + BRAND).length;
  return variants.find((v) => len(v) >= TITLE_MIN && len(v) <= TITLE_MAX) ?? variants.filter((v) => len(v) <= TITLE_MAX)[0] ?? variants.at(-1)!;
}

// description: первый абзац определения; короткий дополняем, длинный обрезаем по слову
// description: первые целые предложения абзаца в пределах 120–160 символов; короткий дополняем хвостом.
// Обрезка по слову с многоточием — только если первое предложение само длиннее 160 символов.
function termDescription(short: string) {
  const text = short.replace(/…$/, "").trim();
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map((x) => x.trim()) ?? [text];
  let d = "";
  for (const s of sentences) { const next = d ? `${d} ${s}` : s; if (next.length > DESC_MAX) break; d = next; }
  const tail = "Определение, примеры и связанные термины — в глоссарии GEO и SEO.";
  if (!d) return text.slice(0, text.lastIndexOf(" ", DESC_MAX - 1)).replace(/[,;:—–-]\s*$/, "") + "…";
  d = d.replace(/\.?$/, ".").replace(/([!?])\.$/, "$1");
  for (const t of [tail, "Примеры и связанные термины."]) if (d.length < DESC_MIN && (d + " " + t).length <= DESC_MAX) d = `${d} ${t}`;
  // Не хватило целых предложений до 120 символов — как раньше: хвост и обрезка по слову
  if (d.length < DESC_MIN) d = `${text.replace(/\.?$/, ".")} ${tail}`;
  if (d.length > DESC_MAX) d = d.slice(0, d.lastIndexOf(" ", DESC_MAX - 1)).replace(/[,;:—–-]\s*$/, "") + "…";
  return d;
}

const dir = path.join(process.cwd(), "..", "Library", "Glossary");

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

const fileName = (t: string) => t.replace(/[/\\]/g, "-").replace(/:/g, " -").replace(/[#^[\]|"]/g, "").trim();
const section = (md: string, title: string) => md.match(new RegExp(`^## ${title}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m"))?.[1].trim() ?? "";
// Ручной сниппет — раздел «## Сниппет»: «- Заголовок: …» (без « — NikAlimp») и «- Описание: …»; иначе собираются автоматически.
const snippet = (raw: string) => ({
  title: raw.match(/^\s*[-*]\s+Заголовок:\s*(.+)$/mi)?.[1].trim() ?? "",
  description: raw.match(/^\s*[-*]\s+Описание:\s*(.+)$/mi)?.[1].trim() ?? "",
});
const stripMd = (s: string) => s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, n: string, l?: string) => l ?? n.replace(/ \(термин\)$/, "")).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();

let cache: Term[] | null = null;

export function getTerms(): Term[] {
  if (cache) return cache;
  if (!fs.existsSync(path.join(dir, "glossary-terms.csv"))) return (cache = []);
  const [head, ...rows] = parseCsv(fs.readFileSync(path.join(dir, "glossary-terms.csv"), "utf8").replace(/^﻿/, "")).filter((r) => r.length > 1);
  const col = (n: string) => head.indexOf(n);
  const raw = rows.map((r) => {
    const term = r[col("Термин")];
    const base = path.join(dir, "Термины", fileName(term));
    const file = [`${base}.md`, `${base} (термин).md`].find((f) => fs.existsSync(f));
    const md = file ? fs.readFileSync(file, "utf8") : "";
    return {
      term, en: r[col("English")], expansion: col("Расшифровка") >= 0 ? (r[col("Расшифровка")] ?? "").trim() : "", synonyms: r[col("Синонимы")].split(",").map((s) => s.trim()).filter(Boolean),
      category: r[col("Категория")], letter: r[col("Буква")], slug: r[col("Slug")],
      def: section(md, "Определение"), rel: section(md, "Связанные термины"), snippet: snippet(section(md, "Сниппет")),
    };
  });
  const bySlugName = new Map(raw.filter((t) => t.def).map((t) => [t.term.toLowerCase(), t.slug]));
  const resolve = (name: string) => bySlugName.get(name.replace(/ \(термин\)$/, "").toLowerCase());
  // [[Термин|подпись]] → ссылка на опубликованный термин, иначе просто текст
  const wiki = (s: string) => s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, n: string, label?: string) => {
    const slug = resolve(n); const text = label ?? n.replace(/ \(термин\)$/, "");
    return slug ? `[${text}](/glossary/${slug}/)` : text;
  });
  cache = raw.filter((t) => t.def).map((t) => {
    const related = [...t.rel.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)]
      .map((m) => ({ term: m[2] ?? m[1].replace(/ \(термин\)$/, ""), slug: resolve(m[1]) }))
      .filter((x): x is TermRef => !!x.slug && x.slug !== t.slug);
    const first = stripMd(t.def.split(/\n\s*\n/)[0]);
    const words = stripMd(t.def).split(" ").filter(Boolean).length;
    return {
      term: t.term, en: t.en, expansion: t.expansion, synonyms: t.synonyms, category: t.category, letter: t.letter, slug: t.slug,
      body: typograf(wiki(t.def)), short: typograf(first.length > 220 ? first.slice(0, first.lastIndexOf(" ", 210)) + "…" : first), related,
      words, metaTitle: typograf(t.snippet.title || termTitle(t.term, t.expansion, t.en, t.synonyms)), metaDescription: typograf(t.snippet.description || termDescription(first)),
    };
  });
  // Стандарт AI-Ready сайта §2: каждая индексируемая страница — от TARGET_WORDS слов. Короткие термины видно в логе сборки.
  const short = cache.filter((t) => t.words < TARGET_WORDS);
  if (short.length) console.warn(`⚠ Глоссарий: ${short.length} терминов короче ${TARGET_WORDS} слов — дописать: ${short.map((t) => `${t.term} (${t.words})`).join(", ")}`);
  return cache;
}

export const getTerm = (slug: string) => getTerms().find((t) => t.slug === slug);

// ── Автоссылки на глоссарий ──
// Первое упоминание термина (или синонима) в тексте становится ссылкой на /glossary/<slug>/.
// Не трогает заголовки, код, существующие ссылки, HTML и URL. Латинские аббревиатуры (GEO, SEO) — с учётом регистра.
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let matchers: { slug: string; term: string; re: RegExp }[] | null = null;

function getMatchers() {
  if (matchers) return matchers;
  const list: { slug: string; term: string; name: string }[] = [];
  for (const t of getTerms()) for (const name of [t.term, ...t.synonyms]) if (name && name.length >= 3) list.push({ slug: t.slug, term: t.term, name });
  list.sort((a, b) => b.name.length - a.name.length); // длинные первыми: «GEO-аудит» раньше «GEO»
  return (matchers = list.map(({ slug, term, name }) => ({
    slug, term,
    re: new RegExp(`(?<![\\p{L}\\p{N}_/.-])${esc(name).replace(/ /g, "[ \\u00A0]")}(?![\\p{L}\\p{N}_-])`, /^[A-Z0-9.-]+$/.test(name) ? "u" : "iu"),
  })));
}

const PROTECTED = /(\[[^\]]*\]\([^)]*\)|`[^`]*`|<[^>]+>|https?:\/\/\S+)/;

export function linkTerms(md: string, { max = 12, exclude }: { max?: number; exclude?: string } = {}) {
  // Уже проставленные вручную ссылки на термины не дублируем
  const used = new Set<string>([...(exclude ? [exclude] : []), ...[...md.matchAll(/\]\(\/glossary\/([^/)]+)\/?\)/g)].map((m) => m[1])]);
  let count = 0;
  let fence = false;
  const link = (text: string): string => {
    if (count >= max || !text.trim()) return text;
    for (const { slug, re } of getMatchers()) {
      if (used.has(slug)) continue;
      const m = re.exec(text);
      if (!m) continue;
      used.add(slug); count++;
      return link(text.slice(0, m.index)) + `[${m[0]}](/glossary/${slug}/)` + link(text.slice(m.index + m[0].length));
    }
    return text;
  };
  return md.split("\n").map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return line; }
    if (fence || /^\s*(#|<|\[\^)/.test(line)) return line;
    return line.split(PROTECTED).map((seg, i) => (i % 2 ? seg : link(seg))).join("");
  }).join("\n");
}

// Термины, которые упоминаются в тексте, — для блока «Термины по теме»
export function termsIn(text: string, max = 10): TermRef[] {
  const found = new Map<string, TermRef>();
  for (const { slug, term, re } of getMatchers()) {
    if (found.size >= max) break;
    if (!found.has(slug) && re.test(text)) found.set(slug, { term, slug });
  }
  return [...found.values()];
}

// Все буквы алфавита навигации (в т.ч. без опубликованных терминов): сначала кириллица, потом латиница
export function getLetters() {
  const ru = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ".split("");
  const en = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const used = new Set(getTerms().map((t) => t.letter));
  const extra = [...used].filter((l) => !ru.includes(l) && !en.includes(l));
  return [...ru, ...en, ...extra].map((l) => ({ letter: l, active: used.has(l) }));
}
