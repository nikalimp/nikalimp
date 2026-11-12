// Проектные настройки npm run check для nikalimp.ru (scripts/check.mjs — копия из стартера, его не правим).
// Юридические тексты собраны генератором и переносятся дословно — Главред их не оценивает.
import fs from "node:fs";
// База стартапов: слоганы пишут сами команды на Product Radar, мы их не редактируем — Главред их не оценивает.
const startups = (() => { try { return JSON.parse(fs.readFileSync(new URL("../../Library/Startups/startups.json", import.meta.url), "utf8")); } catch { return { categories: [] }; } })();
export const glavredSkip = ["/privacy-policy/", "/consent/", "/terms/", "/startups/", ...startups.categories.map((c) => `/startups/c/${c.slug}/`)];
// Согласие на обработку ПДн — короткий юридический документ, добивать объём нельзя.
export const thinOk = ["/consent/"];
// Крошки на первом уровне адреса — только там, где у страницы двойная вложенность (решение Ника 23.10.2026)
export const crumbsOk = ["/semantics/"];
