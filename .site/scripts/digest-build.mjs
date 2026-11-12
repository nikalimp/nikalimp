#!/usr/bin/env node
/**
 * Собирает выпуск дайджеста content/digest/<год>-w<неделя>.md. Запуск — GitHub Actions по вторникам (digest.yml).
 *
 * Выпуск = ИИ-вступление + список сюжетов за 7 дней до запуска.
 *  1. Сюжеты: отметки «В дайджест» из ленты кабинета (.dashboard/news/picks.json).
 *     Если отметок меньше MIN, выпуск добирает сюжеты недели, о которых написали больше всего изданий (.dashboard/news/items.jsonl).
 *  2. Обзор сюжета не пишется заново: берутся готовые summary и why, которые сборщик ленты получил от Claude.
 *  3. Вступление — один запрос к Claude (ANTHROPIC_API_KEY). Без ключа — вступление по шаблону.
 * Готовый выпуск не перезаписывается: его можно поправить руками.
 *
 * Запуск: node .site/scripts/digest-build.mjs [--dry-run] [--force]
 * Печатает в stdout путь нового файла или ничего, если выпуска нет.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, "..");
// Лента кабинета живёт в приватном NikitOS: задача Digest там кладёт путь в NEWS_DIR (сайт с 12.11.2026 — отдельный репозиторий).
const NEWS = process.env.NEWS_DIR || path.resolve(SITE, "../.dashboard/news");
const OUT = path.join(SITE, "content/digest");
const MIN = 8; // минимум сюжетов в выпуске
const MAX = 14; // максимум
const PER_TOPIC = 5; // автодобор: не больше сюжетов одной темы
const MODEL = process.env.NEWS_MODEL || "claude-haiku-5-5";

const TOPIC = { ai: "ИИ", business: "Бизнес", gadgets: "Гаджеты", trends: "Тренды", marketing: "Маркетинг", other: "Разное" };
const ORDER = Object.keys(TOPIC);
const COUNTRY = { us: "США", cn: "Китай", ru: "Россия", world: "Мир" };
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);

const one = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const esc = (s) => one(s).replace(/([\[\]*_`#])/g, "\\$1");
const q = (s) => `"${one(s).replace(/"([^"]*)"/g, "«$1»").replace(/"/g, "'")}"`;
const cut = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/[\s,;:]+\S*$/, "") + "…");

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7));
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return { y, w };
}

// Окно выпуска: 7 суток до запуска (вторник → прошлый вторник)
const now = new Date();
const end = now;
const start = new Date(now.getTime() - 7 * 86400000);
const { y, w } = isoWeek(now);
const slug = `${y}-w${String(w).padStart(2, "0")}`;
const file = path.join(OUT, `${slug}.md`);
if (fs.existsSync(file) && !flag("--force") && !flag("--dry-run")) {
  console.error(`Выпуск ${slug} уже есть — не трогаю`);
  process.exit(0);
}

const readJson = (f, d) => {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return d;
  }
};
const picks = readJson(path.join(NEWS, "picks.json"), {});
const items = [];
try {
  for (const line of fs.readFileSync(path.join(NEWS, "items.jsonl"), "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      items.push(JSON.parse(line));
    } catch {}
  }
} catch {}
const byId = new Map(items.map((x) => [x.id, x]));
const inWindow = (iso) => iso >= start.toISOString() && iso < end.toISOString();

// 1. Отметки Ника
const chosen = Object.entries(picks)
  .filter(([, p]) => p && p.s === "digest" && inWindow(p.at))
  .sort(([, a], [, b]) => a.at.localeCompare(b.at))
  .map(([id, p]) => {
    const it = byId.get(id);
    return { story: it?.story ?? id, title: p.title, summary: p.summary || it?.summary || "", why: p.why || it?.why || "", note: p.note || "", url: p.url, source: p.source, topic: p.topic, country: p.country, sources: 1, picked: true };
  });

// 2. Автодобор: сюжеты, о которых написали больше всего изданий, по одной статье (первоисточнику) на сюжет
if (chosen.length < MIN) {
  const stories = new Map();
  for (const x of items) {
    if (!x.ai || x.topic === "other" || !inWindow(x.ts) || !x.summary) continue;
    const list = stories.get(x.story) ?? [];
    list.push(x);
    stories.set(x.story, list);
  }
  const taken = new Set(chosen.map((c) => c.story));
  // скрытые в кабинете сюжеты в выпуск не берём
  for (const [id, p] of Object.entries(picks)) if (p?.s === "hidden") taken.add(byId.get(id)?.story ?? id);
  const perTopic = {};
  for (const c of chosen) perTopic[c.topic] = (perTopic[c.topic] ?? 0) + 1;
  const ranked = [...stories.entries()]
    .filter(([k]) => !taken.has(k))
    .map(([k, list]) => {
      const lead = [...list].sort((a, b) => a.ts.localeCompare(b.ts))[0];
      return { k, lead, sources: new Set(list.map((x) => x.source)).size };
    })
    .sort((a, b) => b.sources - a.sources || b.lead.ts.localeCompare(a.lead.ts));
  for (const { k, lead, sources } of ranked) {
    if (chosen.length >= MIN) break;
    if ((perTopic[lead.topic] ?? 0) >= PER_TOPIC) continue;
    perTopic[lead.topic] = (perTopic[lead.topic] ?? 0) + 1;
    chosen.push({ story: k, title: lead.titleRu || lead.title, summary: lead.summary, why: lead.why, note: "", url: lead.url, source: lead.sourceName, topic: lead.topic, country: lead.country, sources, picked: false });
  }
}
const list = chosen.slice(0, MAX);
if (!list.length) {
  console.error(`За неделю ${slug} нет сюжетов — выпуска нет`);
  process.exit(0);
}
list.sort((a, b) => ORDER.indexOf(a.topic) - ORDER.indexOf(b.topic) || b.sources - a.sources);

// 3. Вступление
const last = new Date(end.getTime() - 86400000);
const range =
  start.getUTCMonth() === last.getUTCMonth()
    ? `${start.getUTCDate()}–${last.getUTCDate()} ${MONTHS[last.getUTCMonth()]} ${last.getUTCFullYear()}`
    : `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} – ${last.getUTCDate()} ${MONTHS[last.getUTCMonth()]} ${last.getUTCFullYear()}`;
const topics = [...new Set(list.map((x) => x.topic))];

async function aiIntro() {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!key) return null;
  const brief = list.map((x, i) => `${i + 1}. [${TOPIC[x.topic]}, ${COUNTRY[x.country] ?? "Мир"}] ${one(x.title)} — ${one(x.summary)}${x.note ? ` Вывод автора: ${one(x.note)}` : ""}`).join("\n");
  const prompt = `Ты пишешь вступление к недельному дайджесту для блога Никиты Алимпиева — дизайнера и предпринимателя. Читатели — владельцы бизнеса и маркетологи из России.

Ниже сюжеты недели ${range}. Напиши вступление: 2 абзаца, всего 90–140 слов, на русском, от первого лица («я»).
Первый абзац — главная мысль недели: что объединяет сюжеты и какой из них самый важный.
Второй абзац — что из этого следует для бизнеса и маркетинга в России, конкретно.
Правила: одна мысль в предложении; действительный залог; без канцелярита, штампов и оценочных слов («уникальный», «революционный», «важно отметить»); без заголовков, списков и эмодзи; не выдумывай фактов, которых нет в сюжетах. Верни только текст вступления.

Сюжеты:
${brief}`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) throw new Error(`Claude ответил ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    const txt = (j.content ?? []).map((b) => b.text ?? "").join("").trim();
    return txt || null;
  } catch (e) {
    console.error(`✗ Вступление от Claude не получилось: ${e.message}`);
    return null;
  }
}

const counts = topics.map((t) => `${TOPIC[t] === "ИИ" ? "ИИ" : TOPIC[t].toLowerCase()} — ${list.filter((x) => x.topic === t).length}`).join(", ");
const intro =
  (await aiIntro()) ??
  `В выпуске ${list.length} сюжетов недели ${range}: ${counts}. Больше всего изданий написали о сюжете «${one([...list].sort((a, b) => b.sources - a.sources)[0].title)}». У каждого сюжета ниже есть короткий обзор, объяснение, почему он важен для бизнеса, и ссылка на первоисточник.`;
list.sort((a, b) => ORDER.indexOf(a.topic) - ORDER.indexOf(b.topic) || b.sources - a.sources);

// 4. Файл выпуска
const names = topics.map((t) => (t === "ai" ? "ИИ" : TOPIC[t].toLowerCase()));
const joined = names.length > 1 ? `${names.slice(0, -1).join(", ")} и ${names.at(-1)}` : names[0];
let title = `Дайджест ${range}: ${joined}`;
if (title.length < 40) title += " — главное за неделю";
const description = cut(`Главное за неделю ${range}: ${list.slice(0, 3).map((x) => one(x.title)).join("; ")}.`, 158);

let body = `${intro.trim()}\n`;
for (const t of topics) {
  body += `\n## ${TOPIC[t]}\n`;
  for (const x of list.filter((i) => i.topic === t)) {
    body += `\n### ${esc(x.title)}\n\n*${COUNTRY[x.country] ?? "Мир"} · ${esc(x.source)}*\n\n`;
    if (x.summary) body += `${one(x.summary)}\n\n`;
    if (x.why) body += `**Почему важно.** ${one(x.why)}\n\n`;
    if (x.note) body += `**Мой вывод.** ${String(x.note).trim()}\n\n`;
    body += `[Читать в первоисточнике: ${esc(x.source)}](${x.url})\n`;
  }
}

const md = `---
title: ${q(title)}
description: ${q(description)}
date: ${now.toISOString().slice(0, 10)}
week: ${y}-W${String(w).padStart(2, "0")}
count: ${list.length}
---

${body}`;

if (flag("--dry-run")) {
  console.error(md);
  process.exit(0);
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(file, md, "utf8");
console.log(path.relative(path.resolve(SITE, ".."), file));
