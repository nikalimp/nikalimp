// Коллекция сайтов: собирает Library/Sites/sites.json. Сейчас источник один — галерея Made on Tilda (src: "madeontilda").
// Вход (Library/Sites/source): state.json — список галереи (crawl.py), sites.jsonl — разбор главных страниц (sites.py),
// niche.csv — ниша каждого сайта (uid,slug). Запуск из .site: node scripts/sites-import.mjs
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "../Library/Sites");
const src = path.join(dir, "source");
const gallery = Object.values(JSON.parse(fs.readFileSync(path.join(src, "state.json"), "utf8")).items);
const pages = new Map(fs.readFileSync(path.join(src, "sites.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => { const x = JSON.parse(l); return [String(x.uid), x]; }));
const niche = new Map(fs.readFileSync(path.join(src, "niche.csv"), "utf8").split("\n").filter(Boolean).map((l) => { const [u, k] = l.trim().split(","); return [u, k]; }));

// Категории — как в галерее-источнике, только во множественном числе
const CATS = [
  ["bu", "business", "Бизнес"], ["st", "store", "Интернет-магазины"], ["ev", "event", "Мероприятия"], ["ed", "media", "Медиа"],
  ["pf", "portfolio", "Портфолио"], ["cu", "education", "Образование"], ["pr", "personal", "Персональные"], ["ot", "other", "Другое"],
];
// Подкатегории — ниши (тематика проекта)
const NICHES = {
  construction: "Строительство и ремонт", realty: "Недвижимость", interior: "Архитектура и интерьер", medicine: "Медицина",
  beauty: "Красота и уход", sport: "Спорт и фитнес", food: "Еда и рестораны", travel: "Туризм и отели", education: "Курсы и школы",
  kids: "Детям", it: "IT и сервисы", marketing: "Маркетинг и реклама", design: "Дизайн", "photo-video": "Фото и видео",
  fashion: "Одежда и аксессуары", jewelry: "Украшения", auto: "Авто и транспорт", industry: "Производство и B2B",
  "finance-law": "Финансы, право, консалтинг", events: "Ивенты и праздники", culture: "Культура и искусство", media: "СМИ и блоги",
  psychology: "Психология и коучинг", "home-goods": "Товары и подарки", "agro-eco": "Агро и экология", nonprofit: "НКО и соцпроекты",
  pets: "Животные", other: "Разное",
};

const clean = (s = "") => s.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const date = (t) => (t ? new Date(t * 1000).toISOString().slice(0, 10) : "");
function slugOf(u) {
  try {
    const x = new URL(u);
    const p = x.pathname.replace(/\/+$/, "");
    return (x.hostname.replace(/^www\./, "") + p).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  } catch { return ""; }
}
// «Бренд — что делает» → имя и слоган
function split(title) {
  const t = clean(title);
  const m = t.match(/^(.{2,60}?)\s+[—–|-]\s+(.+)$/) || t.match(/^(.{2,60}?)\s*[|:]\s+(.+)$/);
  return m ? [m[1].trim(), m[2].trim().replace(/[.!]$/, "")] : [t, ""];
}
// Признаки главной: только надёжные (скрипты анимации и попапов Тильда грузит на всех сайтах — их не считаем)
const FEATS = ["form", "quiz", "cart", "video", "map", "blog", "slider", "sbs"];

const used = new Set();
const items = [];
for (const g of gallery) {
  const pg = pages.get(String(g.uid)) ?? {};
  const live = pg.code === 200;
  let s = slugOf(g.url);
  if (!s) continue;
  while (used.has(s)) s += "-2";
  used.add(s);
  const [n, t] = split(g.title);
  const cat = (CATS.find((c) => c[0] === (g.category || "ot")) ?? CATS[7])[1];
  const k = NICHES[niche.get(String(g.uid))] ? niche.get(String(g.uid)) : "other";
  const desc = clean(pg.desc || pg.ogdesc || "");
  items.push({
    s, n, t, u: g.url, c: cat, k, src: "madeontilda",
    img: g.img || g.img_auto, big: g.img_big_upload || g.img_big || g.img || g.img_auto,
    d: date(g.date_published || g.date), l: Number(g.likes) || 0,
    ...(g.d_nick ? { a: clean(g.d_title), an: g.d_nick } : {}),
    ...(desc && desc !== clean(g.title) ? { ds: desc.slice(0, 400) } : {}),
    live, tilda: !!pg.tilda,
    ...(live ? { rc: pg.recs || 0, z: pg.zero || 0, f: (pg.feat || []).filter((x) => FEATS.includes(x)) } : {}),
  });
}
// Свежие сверху — как в галерее
items.sort((a, b) => (b.d > a.d ? 1 : b.d < a.d ? -1 : b.l - a.l));

const categories = [];
for (const [, slug, name] of CATS) {
  const inCat = items.filter((i) => i.c === slug && i.live);
  categories.push({ slug, name, count: inCat.length });
  const counts = {};
  for (const i of inCat) counts[i.k] = (counts[i.k] || 0) + 1;
  for (const [k, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) categories.push({ slug: `${slug}/${k}`, name: NICHES[k], parent: slug, niche: k, count });
}
const out = { sources: { madeontilda: { name: "Made on Tilda", url: "https://madeontilda.ru" } }, updated: new Date().toISOString().slice(0, 10), categories, niches: NICHES, items };
fs.writeFileSync(path.join(dir, "sites.json"), JSON.stringify(out));
console.log(`sites: ${items.length}, live: ${items.filter((i) => i.live).length}, subcategories: ${categories.filter((c) => c.parent).length}`);
