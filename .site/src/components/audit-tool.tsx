"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, ChevronDown, Copy, Download, Info, Loader2, Search, Send, X } from "lucide-react";
import { audit, priorities, reportText, score, type Facts, type Mode, type Status } from "@/lib/audit";
import { site } from "@/lib/site";

const API = "/api/audit.php";
// Ключ PageSpeed Insights (бесплатный, браузерный, ограничен доменом nikalimp.ru). Без ключа общий лимит Google часто исчерпан —
// тогда блок скорости предлагает открыть PageSpeed Insights вручную.
const PSI_KEY = site.psiKey;

type Psi = { scores: Record<string, number>; metrics: { label: string; value: string; score: number }[]; opportunities: { title: string; saving: string }[]; field?: string };
const CATS: [string, string][] = [["performance", "Скорость"], ["accessibility", "Доступность"], ["best-practices", "Практики"], ["seo", "SEO"]];
const METRICS: [string, string][] = [["first-contentful-paint", "Первый контент (FCP)"], ["largest-contentful-paint", "Главный контент (LCP)"], ["total-blocking-time", "Блокировка (TBT)"], ["cumulative-layout-shift", "Сдвиги макета (CLS)"], ["speed-index", "Индекс скорости"]];

async function runPsi(url: string, mode: Mode): Promise<Psi> {
  const cats = mode === "site" ? ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"] : ["SEO", "PERFORMANCE"];
  const q = new URLSearchParams({ url, strategy: "mobile", locale: "ru" });
  cats.forEach((c) => q.append("category", c));
  if (PSI_KEY) q.set("key", PSI_KEY);
  const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`);
  if (!r.ok) throw new Error(String(r.status));
  const d = await r.json();
  const lh = d.lighthouseResult;
  const scores: Record<string, number> = {};
  for (const [k] of CATS) if (lh.categories[k]) scores[k] = Math.round(lh.categories[k].score * 100);
  const metrics = METRICS.filter(([k]) => lh.audits[k]).map(([k, label]) => ({ label, value: lh.audits[k].displayValue, score: lh.audits[k].score ?? 0 }));
  const opportunities = Object.values(lh.audits as Record<string, { title: string; score: number | null; details?: { type?: string; overallSavingsMs?: number } }>)
    .filter((a) => a.details?.type === "opportunity" && (a.score ?? 1) < 0.9 && (a.details.overallSavingsMs ?? 0) > 100)
    .sort((a, b) => (b.details!.overallSavingsMs ?? 0) - (a.details!.overallSavingsMs ?? 0)).slice(0, 5)
    .map((a) => ({ title: a.title, saving: `−${((a.details!.overallSavingsMs ?? 0) / 1000).toFixed(1)} с` }));
  const fe = d.loadingExperience?.overall_category;
  return { scores, metrics, opportunities, field: fe === "FAST" ? "Реальные пользователи: быстро" : fe === "AVERAGE" ? "Реальные пользователи: средне" : fe === "SLOW" ? "Реальные пользователи: медленно" : undefined };
}

const tone = (n: number) => (n >= 90 ? "text-emerald-600 dark:text-emerald-400" : n >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400");
const ICON: Record<Status, React.ReactNode> = {
  pass: <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-label="хорошо" />,
  warn: <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" aria-label="стоит поправить" />,
  fail: <X className="size-4 text-red-600 dark:text-red-400" aria-label="важно исправить" />,
  info: <Info className="size-4 text-muted-foreground" aria-label="для сведения" />,
};

function Ring({ value, label, size = 112 }: { value: number; label: string; size?: number }) {
  const r = 44, len = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" width={size} height={size} className={tone(value)} role="img" aria-label={`${label}: ${value} из 100`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - value / 100)} transform="rotate(-90 50 50)" />
        <text x="50" y="57" textAnchor="middle" fontSize="26" fontWeight="600" fill="currentColor">{value}</text>
      </svg>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function AuditTool({ mode }: { mode: Mode }) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [facts, setFacts] = useState<Facts | null>(null);
  const [psi, setPsi] = useState<Psi | null | "loading" | "error">(null);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  const groups = useMemo(() => (facts ? audit(facts, mode) : []), [facts, mode]);
  const total = groups.length ? score(groups) : 0;
  const top = useMemo(() => priorities(groups), [groups]);
  const counts = useMemo(() => groups.flatMap((g) => g.checks).reduce((a, k) => ({ ...a, [k.status]: (a[k.status] ?? 0) + 1 }), {} as Record<Status, number>), [groups]);

  const run = async (target: string) => {
    const u = target.trim();
    if (!u) return;
    setState("loading"); setError(""); setFacts(null); setPsi("loading"); setCopied(false);
    const full = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    window.history.replaceState(null, "", `?url=${encodeURIComponent(u)}`);
    if (mode === "geo") setPsi(null); else runPsi(full, mode).then(setPsi).catch(() => setPsi("error"));
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: u }) });
      const d = await r.json().catch(() => ({ error: "Сервер проверки не ответил" }));
      if (!r.ok || !d.ok) throw new Error(d.error || "Не получилось проверить сайт");
      setFacts(d.facts); setState("done");
      try { (window as unknown as { ym?: (...a: unknown[]) => void }).ym?.(site.metrikaId, "reachGoal", mode === "site" ? "site_audit" : mode === "seo" ? "seo_audit" : "geo_check"); } catch {}
    } catch (e) { setError((e as Error).message); setState("error"); }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const u = new URLSearchParams(window.location.search).get("url");
    if (u) { setUrl(u); run(u); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async () => { if (!facts) return; await navigator.clipboard.writeText(reportText(facts, groups, mode)); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const other = mode === "site" ? { href: "/seo-audit/", label: "SEO-аудит этой страницы" } : mode === "seo" ? { href: "/geo-audit/", label: "GEO-проверка" } : { href: "/seo-audit/", label: "SEO-аудит этой страницы" };
  const kind = mode === "site" ? "Технический аудит" : mode === "seo" ? "SEO-аудит" : "GEO-проверка";

  return (
    <div className="audit">
      <form onSubmit={(e) => { e.preventDefault(); run(url); }} className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row print:hidden">
        <label className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-4 focus-within:ring-[3px] focus-within:ring-ring/50">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <span className="sr-only">Адрес сайта</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} type="text" inputMode="url" autoComplete="url" placeholder="example.ru или адрес страницы" className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
        </label>
        <button type="submit" disabled={state === "loading" || !url.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-foreground px-6 font-medium text-background hover:opacity-90 disabled:opacity-50">
          {state === "loading" ? <><Loader2 className="size-4 animate-spin" />Проверяю…</> : <>Проверить <ArrowRight className="size-4" /></>}
        </button>
      </form>
      <p className="mt-3 text-center text-sm text-muted-foreground print:hidden">Бесплатно и без регистрации. Проверка занимает 10⁠–⁠40 секунд.</p>

      {state === "loading" && (
        <div className="mx-auto mt-10 max-w-2xl rounded-xl border bg-card p-6 text-sm text-muted-foreground" aria-live="polite">
          <p className="flex items-center gap-2 font-medium text-foreground"><Loader2 className="size-4 animate-spin" />{mode === "geo" ? "Захожу на сайт как боты нейросетей" : "Открываю сайт как поисковый робот"}</p>
          <p className="mt-2">{mode === "geo" ? "Открываю страницу от имени GPTBot, ClaudeBot, PerplexityBot и YandexBot, читаю robots.txt, llms.txt, карту сайта и разметку." : "Скачиваю страницу, robots.txt, карту сайта и llms.txt, проверяю редиректы и заголовки. Скорость меряет Google Lighthouse — это ещё 20⁠–⁠30 секунд."}</p>
        </div>
      )}
      {state === "error" && <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-red-500/30 bg-red-500/5 p-5 text-sm" role="alert">{error}</p>}

      {state === "done" && facts && (
        <div className="mt-10" aria-live="polite">
          <div className="grid gap-4 rounded-2xl border bg-card p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
            <Ring value={total} label="из 100" size={140} />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{kind} · {new Date().toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })}</p>
              <p className="mt-1 break-all text-xl font-semibold">{facts.final}</p>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5">{ICON.fail}Важно: {counts.fail ?? 0}</span>
                <span className="inline-flex items-center gap-1.5">{ICON.warn}Поправить: {counts.warn ?? 0}</span>
                <span className="inline-flex items-center gap-1.5">{ICON.pass}В порядке: {counts.pass ?? 0}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                <button type="button" onClick={copy} className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-accent"><Copy className="size-4" />{copied ? "Скопировано" : "Скопировать отчёт"}</button>
                <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-accent"><Download className="size-4" />Сохранить в PDF</button>
                <a href={`${other.href}?url=${encodeURIComponent(facts.final)}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-accent">{other.label}<ArrowRight className="size-4" /></a>
              </div>
            </div>
          </div>

          {top.length > 0 && (
            <div className="mt-6 rounded-2xl border border-brand/30 bg-brand-bg p-6">
              <h2 className="text-lg font-semibold">Исправьте в первую очередь</h2>
              <ol className="mt-3 space-y-2">
                {top.map((k, i) => (
                  <li key={k.id} className="flex gap-3 text-sm"><span className="font-mono text-muted-foreground">{i + 1}.</span><span><span className="font-medium">{k.title}</span>{k.fix && <span className="text-muted-foreground"> — {k.fix}</span>}</span></li>
                ))}
              </ol>
            </div>
          )}

          {mode !== "geo" && <PsiBlock psi={psi} url={facts.final} mode={mode} />}

          <div className="mt-6 space-y-4">
            {groups.map((g) => {
              const s = score([g]);
              return (
                <section key={g.title} className="rounded-2xl border bg-card">
                  <h2 className="flex items-center justify-between gap-4 border-b px-5 py-4 text-base font-semibold">{g.title}<span className={`font-mono text-sm ${tone(s)}`}>{s}/100</span></h2>
                  <ul className="divide-y">
                    {g.checks.map((k) => (
                      <li key={k.id}>
                        <details className="group px-5 py-3.5" open={k.status === "fail"}>
                          <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
                            <span className="mt-0.5 shrink-0">{ICON[k.status]}</span>
                            <span className="min-w-0 flex-1"><span className="font-medium">{k.title}</span>{k.value && <span className="mt-0.5 block break-words text-sm text-muted-foreground">{k.value}</span>}</span>
                            <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 print:hidden" />
                          </summary>
                          <div className="mt-2 pl-7 text-sm text-muted-foreground">
                            <p>{k.why}</p>
                            {k.status !== "pass" && k.fix && <p className="mt-1.5 text-foreground"><span className="font-medium">Как исправить:</span> {k.fix}</p>}
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border bg-foreground p-6 text-background sm:p-8 print:hidden">
            <h2 className="text-2xl font-semibold tracking-tight">Нужен план исправлений?</h2>
            <p className="mt-2 max-w-2xl text-background/75">Пришлите отчёт мне в Telegram — бесплатно разберу, что исправить в первую очередь и сколько это займёт. Отчёт уже скопирован в один клик.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={site.telegram} target="_blank" rel="noopener" onClick={copy} className="inline-flex h-11 items-center gap-2 rounded-lg bg-background px-5 font-medium text-foreground hover:opacity-90"><Send className="size-4" />Скопировать и отправить в Telegram</a>
              <a href={mode === "seo" ? "/geo-audit/" : mode === "geo" ? "#full-audit" : "/services/corporate-website/"} className="inline-flex h-11 items-center gap-2 rounded-lg border border-background/30 px-5 font-medium hover:bg-background/10">{mode === "seo" ? "GEO-проверка: готов ли сайт к нейросетям" : mode === "geo" ? "Полный GEO-аудит с замером ответов" : "Новый сайт без этих ошибок"}<ArrowRight className="size-4" /></a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PsiBlock({ psi, url, mode }: { psi: Psi | null | "loading" | "error"; url: string; mode: Mode }) {
  const link = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}`;
  return (
    <section className="mt-6 rounded-2xl border bg-card p-6">
      <h2 className="flex flex-wrap items-baseline justify-between gap-2 text-base font-semibold">Google Lighthouse, мобильная версия<a href={link} target="_blank" rel="noopener" className="text-sm font-normal text-brand hover:underline print:hidden">Подробнее в PageSpeed Insights →</a></h2>
      {psi === "loading" && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Lighthouse меряет скорость, обычно 20⁠–⁠30 секунд…</p>}
      {psi === "error" && <p className="mt-3 text-sm text-muted-foreground">Google сейчас не отдал замер — его бесплатный лимит на сегодня исчерпан. Откройте <a href={link} target="_blank" rel="noopener" className="text-brand underline underline-offset-2">PageSpeed Insights</a>: там тот же Lighthouse, адрес уже подставлен.</p>}
      {psi && typeof psi === "object" && (
        <>
          <div className={`mt-5 grid gap-4 ${mode === "site" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>{CATS.filter(([k]) => psi.scores[k] !== undefined).map(([k, label]) => <Ring key={k} value={psi.scores[k]} label={label} size={88} />)}</div>
          <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
            {psi.metrics.map((m) => <li key={m.label} className="flex justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2"><span className="text-muted-foreground">{m.label}</span><span className={`font-medium tabular-nums ${tone(m.score * 100)}`}>{m.value}</span></li>)}
          </ul>
          {psi.field && <p className="mt-3 text-sm text-muted-foreground">{psi.field} (данные Chrome за 28 дней)</p>}
          {psi.opportunities.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium">Что ускорит загрузку</p>
              <ul className="mt-2 space-y-1.5 text-sm">{psi.opportunities.map((o) => <li key={o.title} className="flex justify-between gap-3"><span>{o.title}</span><span className="shrink-0 font-mono text-muted-foreground">{o.saving}</span></li>)}</ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
