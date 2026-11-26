// Белый список страниц сравнения /tools/compare/<a>-vs-<b>/ (решение Ника 26.11.2026).
// Код умеет собрать ~12 000 пар из справочника Library/Tools, но показы в Google есть лишь у малой части.
// Оставляем пары, которые индексируются и набирают просмотры, — по свежим выгрузкам в specs/reports:
//   • Search Console, pages90: от MIN_IMPRESSIONS показов за 90 дней или хотя бы один клик;
//   • Метрика, landing90: хотя бы один визит со входом на страницу.
// Список только растёт: пара, попавшая в него раньше, не выпадает из-за одной слабой недели.
// Запуск: npm run compare:keep (после свежей выгрузки gsc/yandex). Результат — src/lib/compare-keep.json.
import fs from "node:fs";
import path from "node:path";

const MIN_IMPRESSIONS = 3;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const reports = path.join(root, "specs/reports");
const outFile = path.join(root, "src/lib/compare-keep.json");

const latest = (dir) => {
  const files = fs.readdirSync(path.join(reports, dir)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  if (!files.length) throw new Error(`Нет выгрузок в specs/reports/${dir}`);
  return path.join(reports, dir, files.at(-1));
};
const slugOf = (url) => url.match(/\/tools\/compare\/([^/?#]+)\/?/)?.[1];

const keep = new Set();
const gscFile = latest("gsc");
const gsc = JSON.parse(fs.readFileSync(gscFile, "utf8"));
for (const p of gsc.pages90 ?? []) {
  const slug = slugOf(p.page);
  if (!slug) continue;
  if (p.impressions >= MIN_IMPRESSIONS || p.clicks > 0) keep.add(slug);
}

const yaFile = latest("yandex");
const ya = JSON.parse(fs.readFileSync(yaFile, "utf8"));
for (const row of ya.metrika?.landing90?.rows ?? []) {
  const slug = slugOf(row.key ?? "");
  if (slug && (row.values?.[0] ?? 0) > 0) keep.add(slug);
}

const prev = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : { slugs: [] };
const slugs = [...new Set([...prev.slugs, ...keep])].sort();

fs.writeFileSync(
  outFile,
  JSON.stringify(
    {
      _: "Белый список /tools/compare/. Собирает scripts/compare-keep.mjs из specs/reports; руками не править.",
      updated: new Date().toISOString().slice(0, 10),
      sources: [path.relative(root, gscFile), path.relative(root, yaFile)],
      rule: `GSC 90 дней: от ${MIN_IMPRESSIONS} показов или клик; Метрика 90 дней: визит`,
      slugs,
    },
    null,
    2,
  ) + "\n",
);
console.log(`compare-keep: ${slugs.length} пар (новых ${slugs.length - prev.slugs.length}) → ${path.relative(root, outFile)}`);
