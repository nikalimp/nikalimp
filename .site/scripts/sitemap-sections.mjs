// После сборки: делит out/sitemap.xml на карты по разделам (out/sitemaps/<раздел>.xml) и собирает out/sitemap-index.xml.
// Зачем: в Search Console один sitemap на 6 000+ адресов показывает «проиндексировано 0» без разбивки.
// Карта по разделу даёт долю индекса по каждому разделу (Search Console 9.11). Общий sitemap.xml остаётся как был:
// его читают robots.txt, check.mjs, indexnow.mjs и gsc-report.mjs (deploy-kit).
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");
const src = path.join(OUT, "sitemap.xml");
if (!fs.existsSync(src)) { console.log("sitemap-sections: out/sitemap.xml нет — пропускаю"); process.exit(0); }

// Раздел → файл. Всё, что не попало в список, — в pages.xml (главная, услуги, генераторы, кейсы).
const GROUPS = {
  blog: ["blog"], glossary: ["glossary"], tools: ["tools"], startups: ["startups"], fonts: ["fonts"], sites: ["sites"],
  design: ["design-styles", "design-systems", "ui-libraries", "libraries"],
};
const groupOf = (loc) => {
  const first = new URL(loc).pathname.split("/").filter(Boolean)[0] ?? "";
  return Object.keys(GROUPS).find((g) => GROUPS[g].includes(first)) ?? "pages";
};

const xml = fs.readFileSync(src, "utf8");
const origin = new URL(xml.match(/<loc>([^<]+)<\/loc>/)[1]).origin;
const entries = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
const by = new Map();
for (const e of entries) {
  const loc = e.match(/<loc>([^<]+)<\/loc>/)[1].trim();
  const g = groupOf(loc);
  by.set(g, [...(by.get(g) ?? []), e]);
}

const head = '<?xml version="1.0" encoding="UTF-8"?>\n';
fs.mkdirSync(path.join(OUT, "sitemaps"), { recursive: true });
const files = [];
for (const [g, list] of [...by].sort(([a], [b]) => a.localeCompare(b))) {
  fs.writeFileSync(path.join(OUT, "sitemaps", `${g}.xml`), `${head}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.join("\n")}\n</urlset>\n`);
  files.push(`${origin}/sitemaps/${g}.xml`);
  console.log(`sitemap-sections: ${g}.xml — ${list.length}`);
}
fs.writeFileSync(path.join(OUT, "sitemap-index.xml"), `${head}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map((f) => `<sitemap><loc>${f}</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`);
const total = [...by.values()].reduce((n, l) => n + l.length, 0);
if (total !== entries.length) { console.error(`sitemap-sections: потеряны адреса (${total} из ${entries.length})`); process.exit(1); }
