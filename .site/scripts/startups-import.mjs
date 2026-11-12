// База стартапов: сводит выгрузку Product Radar в Library/Startups/startups.json, который читает сайт.
//
//   node scripts/startups-import.mjs <data.jsonl> <categories.json>
//
// data.jsonl — по строке на проект (собирает Library/Startups/scrape.py), categories.json — /wp-json/wp/v2/categories?per_page=100.
// На сайт идут только публичные факты карточки: название, слоган, сайт, категории, статусы, город, год, голоса.
// Имена основателей, контакты из статусов и длинные описания не переносим.
import fs from "node:fs";
import path from "node:path";

const [rawFile, catFile] = process.argv.slice(2);
if (!rawFile || !catFile) { console.error("node scripts/startups-import.mjs <data.jsonl> <categories.json>"); process.exit(1); }
// Пока в базе только проекты, опубликованные в этом году (решение Ника 01.11.2026). YEAR= — без ограничения.
const YEAR = process.env.YEAR ?? "2026";
const OUT = path.resolve(process.cwd(), "../Library/Startups/startups.json");

// Статусы Product Radar — это тоже категории. На сайте не показываются, хранятся для будущих подборок.
const STATUS = {
  "seeking-investors": "Ищет инвестиции",
  "seeking-cofounder": "Ищет кофаундера",
  "seeking-partners": "Ищет партнёров",
  "selling-startup-project": "Продаётся",
  "hiring": "Нанимает",
  "seeking-mentor": "Ищет ментора",
  "seeking-interns": "Берёт стажёров",
  "open-source": "Open source",
  "startup-cemetery": "Закрыт",
};
// Короткие названия вместо длинных SEO-заголовков Product Radar
const NAME = {
  "ai": "Нейросети и ИИ", "obrazovanie": "Образование", "finansy": "Финансы", "puteshestviya-i-turizm": "Путешествия и туризм",
  "sport": "Спорт", "marketplejsy": "Для продавцов на маркетплейсах", "vse-dlya-adminov-kanalov-i-chatov": "Для админов каналов и чатов",
  "analitika": "Аналитика", "prodvizhenie-biznesa": "Продвижение бизнеса", "project-management": "Управление проектами",
  "customer-support": "Поддержка клиентов", "baza-znanij": "Базы знаний", "for-developers": "Для разработчиков",
  "telegram-bots": "Телеграм-боты и мини-приложения", "no-code": "No-code", "website-builder": "Конструкторы сайтов",
  "restorani-kafe-i-dostavka": "Рестораны и доставка", "hr": "HR и персонал", "communities-media": "Сообщества и медиа",
  "telegram-mini-app-builder": "Конструкторы мини-приложений", "mini-app-builder": "Конструкторы мини-приложений Telegram",
};
const clean = (s = "") => s.replace(/&amp;/g, "&").replace(/&#8212;/g, "—").replace(/&#8211;/g, "–").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
  .replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s+/g, " ").trim();

const wp = JSON.parse(fs.readFileSync(catFile, "utf8"));
const byId = new Map(wp.map((c) => [c.id, c]));
const cats = new Map(); // slug → { slug, name, parent }
for (const c of wp) {
  if (STATUS[c.slug] || ["uncategorized", "radar-base", "roasting", "hz"].includes(c.slug)) continue;
  const parent = c.parent ? byId.get(c.parent)?.slug : undefined;
  cats.set(c.slug, { slug: c.slug, name: NAME[c.slug] ?? clean(c.name), parent });
}

function site(raw) {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (/productradar\.ru$/.test(u.hostname)) return undefined;
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|ref$|yclid|fbclid|gclid)/.test(k)) u.searchParams.delete(k);
    return u.toString().replace(/\?$/, "");
  } catch { return undefined; }
}

// Адрес страницы — только латиница, цифры и дефис: «em%c3%b9ser» → «emuser», «touch_me» → «touch-me»
const slug = (s) => decodeURIComponent(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const seen = new Set(); const items = [];
for (const line of fs.readFileSync(rawFile, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const d = JSON.parse(line);
  if (d.skip || !d.name || seen.has(d.slug)) continue;
  if (YEAR && !(d.published ?? "").startsWith(YEAR)) continue;
  seen.add(d.slug);
  const slugs = (d.cats ?? []).map(([p]) => p.split("/").filter(Boolean).pop());
  const c = [...new Set(slugs.filter((s) => cats.has(s)))];
  const st = [...new Set(slugs.filter((s) => STATUS[s]))];
  items.push({
    s: slug(d.slug), n: clean(d.name), t: clean(d.tagline ?? ""), w: site(d.website),
    c, st, f: /бесплат/i.test(d.pricing ?? "") || undefined, p: d.pricing || undefined, city: d.city || undefined,
    d: (d.published ?? "").slice(0, 10) || undefined, v: d.votes ?? 0,
  });
}
items.sort((a, b) => b.v - a.v || a.n.localeCompare(b.n, "ru"));

// Счётчики: у родительской категории — проекты и её, и дочерних
const count = new Map();
for (const it of items) {
  const all = new Set(it.c.flatMap((s) => [s, cats.get(s)?.parent].filter(Boolean)));
  for (const s of all) count.set(s, (count.get(s) ?? 0) + 1);
}
const categories = [...cats.values()].map((c) => ({ ...c, count: count.get(c.slug) ?? 0 })).filter((c) => c.count > 0)
  .sort((a, b) => b.count - a.count);
const statuses = Object.entries(STATUS).map(([code, name]) => ({ code, name, count: items.filter((i) => i.st.includes(code)).length })).filter((s) => s.count);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ source: "https://productradar.ru", updated: new Date().toISOString().slice(0, 10), year: YEAR || undefined, categories, statuses, items }) + "\n");
console.log(`✓ ${items.length} проектов, ${categories.length} категорий → ${path.relative(process.cwd(), OUT)}`);
