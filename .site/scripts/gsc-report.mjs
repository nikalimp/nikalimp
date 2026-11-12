#!/usr/bin/env node
// Еженедельная выгрузка Google Search Console для nikalimp.ru → .site/specs/reports/gsc/YYYY-MM-DD.json
// Запускает GitHub Actions (.github/workflows/gsc-weekly.yml) по воскресеньям; анализ и чек-лист делает
// запланированная задача Claude в 12:34 по Бангкоку. Без зависимостей: JWT сервисного аккаунта подписывается node:crypto.
//
// Секрет GSC_SERVICE_ACCOUNT — JSON-ключ сервисного аккаунта Google Cloud с включённым Search Console API.
// Почта аккаунта (client_email) добавлена пользователем ресурса nikalimp.ru в Search Console.
// GSC_SITE — необязательно: sc-domain:nikalimp.ru или https://nikalimp.ru/ (иначе ищется сам).

import { createSign } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://nikalimp.ru";
const INSPECT = Number(process.env.GSC_INSPECT ?? 120); // лимит API — 2000 проверок в сутки
const API = "https://searchconsole.googleapis.com";
const WM = "https://www.googleapis.com/webmasters/v3";

const b64 = (x) => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");
const day = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

async function token() {
  const raw = process.env.GSC_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Нет секрета GSC_SERVICE_ACCOUNT");
  const sa = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT" });
  const body = b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = createSign("RSA-SHA256").update(`${head}.${body}`).sign(sa.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${body}.${sig}` }) });
  const d = await r.json();
  if (!d.access_token) throw new Error(`Не получил токен: ${JSON.stringify(d)}`);
  return { access: d.access_token, email: sa.client_email };
}

let AUTH = "";
async function call(url, body) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${AUTH}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue; }
    const d = await r.json();
    if (!r.ok) throw new Error(`${r.status} ${url}: ${JSON.stringify(d.error ?? d)}`);
    return d;
  }
  throw new Error(`Не ответил ${url}`);
}

const query = (site, start, end, dimensions = [], rowLimit = 1000, extra = {}) =>
  call(`${WM}/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { startDate: start, endDate: end, dimensions, rowLimit, dataState: "final", ...extra }).then((d) => d.rows ?? []);

const row = (r) => ({ clicks: r.clicks, impressions: r.impressions, ctr: Math.round(r.ctr * 10000) / 100, position: Math.round(r.position * 10) / 10 });

/** Склеиваем текущий и прошлый период по ключу */
function merge(cur, prev, n) {
  const p = new Map(prev.map((r) => [r.keys.join(" | "), r]));
  return cur.slice(0, n).map((r) => {
    const k = r.keys.join(" | "), q = p.get(k);
    return { key: k, ...row(r), prev: q ? row(q) : null };
  });
}

async function sitemapUrls() {
  const out = [];
  const read = async (u) => {
    const x = await (await fetch(u)).text();
    const locs = [...x.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    if (/<sitemapindex/i.test(x)) for (const l of locs) await read(l); else out.push(...locs);
  };
  await read(`${SITE_URL}/sitemap.xml`);
  return out;
}

const section = (u) => { const p = new URL(u).pathname.split("/").filter(Boolean); return p.length ? `/${p[0]}/` : "/"; };

async function main() {
  const t = await token();
  AUTH = t.access;
  const sites = (await call(`${WM}/sites`)).siteEntry ?? [];
  const site = process.env.GSC_SITE || sites.find((s) => s.siteUrl === "sc-domain:nikalimp.ru")?.siteUrl || sites.find((s) => /nikalimp\.ru/.test(s.siteUrl))?.siteUrl;
  if (!site) throw new Error(`Сервисному аккаунту ${t.email} не открыт ресурс nikalimp.ru. Доступные: ${sites.map((s) => s.siteUrl).join(", ") || "нет"}`);

  // Данные Search Console приходят с задержкой ~3 дня
  const end = addDays(new Date(), -3), start = addDays(end, -27), pEnd = addDays(start, -1), pStart = addDays(pEnd, -27);
  const [cS, cE, pS, pE] = [start, end, pStart, pEnd].map(day);

  const [totC, totP, pagesC, pagesP, qC, qP, pq, dev, country, appear, daily] = await Promise.all([
    query(site, cS, cE), query(site, pS, pE),
    query(site, cS, cE, ["page"], 5000), query(site, pS, pE, ["page"], 5000),
    query(site, cS, cE, ["query"], 1000), query(site, pS, pE, ["query"], 1000),
    query(site, cS, cE, ["page", "query"], 5000),
    query(site, cS, cE, ["device"]), query(site, cS, cE, ["country"], 15),
    query(site, cS, cE, ["searchAppearance"]).catch(() => []),
    query(site, cS, cE, ["date"]),
  ]);

  const sitemaps = ((await call(`${WM}/sites/${encodeURIComponent(site)}/sitemaps`)).sitemap ?? []).map((s) => ({
    path: s.path, lastSubmitted: s.lastSubmitted, lastDownloaded: s.lastDownloaded, isPending: s.isPending, errors: s.errors, warnings: s.warnings,
    contents: s.contents,
  }));

  // Покрытие: какая доля адресов из sitemap получает показы, по разделам
  const urls = await sitemapUrls().catch(() => []);
  const seen = new Set(pagesC.map((r) => r.keys[0]));
  const bySection = {};
  for (const u of urls) {
    const s = section(u);
    bySection[s] ??= { urls: 0, withImpressions: 0, clicks: 0, impressions: 0 };
    bySection[s].urls++;
    if (seen.has(u)) bySection[s].withImpressions++;
  }
  for (const r of pagesC) { try { const s = section(r.keys[0]); bySection[s] ??= { urls: 0, withImpressions: 0, clicks: 0, impressions: 0 }; bySection[s].clicks += r.clicks; bySection[s].impressions += r.impressions; } catch {} }

  // URL Inspection: топ страниц по показам + по несколько адресов без показов из каждого раздела
  const top = pagesC.slice(0, Math.round(INSPECT * 0.4)).map((r) => r.keys[0]);
  const silent = urls.filter((u) => !seen.has(u));
  const groups = {};
  for (const u of silent) (groups[section(u)] ??= []).push(u);
  const pick = [];
  const keys = Object.keys(groups);
  for (let i = 0; pick.length < INSPECT - top.length && keys.some((k) => groups[k].length > i); i++) for (const k of keys) if (groups[k][i] && pick.length < INSPECT - top.length) pick.push(groups[k][i]);
  const inspections = [];
  for (const u of [...new Set([...top, ...pick])]) {
    try {
      const d = await call(`${API}/v1/urlInspection/index:inspect`, { inspectionUrl: u, siteUrl: site, languageCode: "ru-RU" });
      const ix = d.inspectionResult?.indexStatusResult ?? {};
      inspections.push({ url: u, hasImpressions: seen.has(u), verdict: ix.verdict, coverageState: ix.coverageState, indexingState: ix.indexingState, robotsTxtState: ix.robotsTxtState, pageFetchState: ix.pageFetchState, lastCrawlTime: ix.lastCrawlTime, googleCanonical: ix.googleCanonical, userCanonical: ix.userCanonical, crawledAs: ix.crawledAs, richResults: d.inspectionResult?.richResultsResult?.detectedItems?.map((x) => x.richResultType) ?? [], richVerdict: d.inspectionResult?.richResultsResult?.verdict });
    } catch (e) { inspections.push({ url: u, error: String(e.message).slice(0, 300) }); }
  }
  const coverage = {};
  for (const i of inspections) { const k = i.coverageState ?? i.error ?? "нет данных"; coverage[k] = (coverage[k] ?? 0) + 1; }

  const report = {
    site, generated: new Date().toISOString(), period: { current: [cS, cE], previous: [pS, pE] },
    totals: { current: totC[0] ? row(totC[0]) : null, previous: totP[0] ? row(totP[0]) : null },
    daily: daily.map((r) => ({ date: r.keys[0], ...row(r) })),
    pages: merge(pagesC, pagesP, 300),
    pagesLost: pagesP.filter((r) => !seen.has(r.keys[0])).slice(0, 50).map((r) => ({ page: r.keys[0], ...row(r) })),
    queries: merge(qC, qP, 300),
    pageQueries: pq.slice(0, 1500).map((r) => ({ page: r.keys[0], query: r.keys[1], ...row(r) })),
    devices: dev.map((r) => ({ device: r.keys[0], ...row(r) })),
    countries: country.map((r) => ({ country: r.keys[0], ...row(r) })),
    searchAppearance: appear.map((r) => ({ type: r.keys[0], ...row(r) })),
    sitemaps, sitemapUrls: urls.length, pagesWithImpressions: pagesC.length, bySection,
    coverage, inspections,
  };
  const file = join(ROOT, "specs/reports/gsc", `${day(new Date())}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(report, null, 1));
  console.log(`✓ ${site}: ${report.totals.current?.clicks ?? 0} кликов, ${report.totals.current?.impressions ?? 0} показов за ${cS}…${cE}; страниц с показами ${pagesC.length} из ${urls.length}; проверено адресов ${inspections.length} → ${file}`);
}

// ::error:: — причина видна в аннотациях запуска (журналы Actions из облачной сессии не читаются)
main().catch((e) => { const m = String(e.message).replace(/\s+/g, " ").slice(0, 900); console.error(`✗ ${m}`); console.log(`::error::GSC: ${m}`); process.exit(1); });
