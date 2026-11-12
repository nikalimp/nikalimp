"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Copy, FileSpreadsheet, FileText, Loader2, Lock, Minus as MinusIcon, Network, RotateCcw, Sparkles, Undo2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { Field, Toggle, inputCls } from "@/components/privacy-generator";
import {
  DEMO, DEMO_MASKS, INTENTS, REGIONS, buildStructure, categoryLabels, demandWords, fmt, intentLabel, multiply, normalize, parseInput,
  parseMinus, prepare, process, splitMinus, stem, structureRows, toCsv,
  type Intent, type MatchType, type RawRow, type Row, type Status, type Structure,
} from "@/lib/semantics";
import { xlsx } from "@/lib/semantics-xlsx";

const STORE = "semantics:v1";
const API = "/api/wordstat.php";
const areaCls = "w-full rounded-md border bg-background px-3 py-2 text-sm leading-relaxed outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";
const selectCls = cn(inputCls, "appearance-none pr-8");

type Source = "paste" | "api" | "mult";
type Tab = Status | "all";

const DEPTHS = [
  { v: 15, label: "Быстро", hint: "до 15 запросов к Вордстату: главные запросы и ближние хвосты" },
  { v: 50, label: "Обычно", hint: "до 50 запросов: хвосты от самых частых фраз" },
  { v: 150, label: "Глубоко", hint: "до 150 запросов: длинные хвосты, тысячи фраз" },
];

function goal(name: string, params?: Record<string, unknown>) {
  const ym = (window as unknown as { ym?: (...a: unknown[]) => void }).ym;
  ym?.(113548506, "reachGoal", name, params);
}

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return `${fmt(n)} ${m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many}`;
};

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: T; label: React.ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="grid gap-1 rounded-lg bg-muted p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} className={cn("inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-sm transition-colors", value === o.v ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Select({ id, value, onChange, children }: { id: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SemanticsTool() {
  const [source, setSource] = useState<Source>("paste");
  const [text, setText] = useState("");
  const [masks, setMasks] = useState("");
  const [code, setCode] = useState("");
  const [depth, setDepth] = useState(50);
  const [region, setRegion] = useState("213");
  const [minusText, setMinusText] = useState("");
  const [removed, setRemoved] = useState<string[]>([]);
  const [off, setOff] = useState<string[]>([]);
  const [product, setProduct] = useState("");
  const [raw, setRaw] = useState<RawRow[]>([]);
  const [tab, setTab] = useState<Tab>("work");
  const [intent, setIntent] = useState<Intent | "all">("all");
  const [sort, setSort] = useState<"count" | "abc">("count");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(200);
  const [structure, setStructure] = useState<Structure | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isDemo, setIsDemo] = useState(false); // первый визит: сразу показываем пример результата
  const [api, setApi] = useState<{ enabled: boolean; left?: number; error?: string }>({ enabled: false });
  const [run, setRun] = useState<{ done: number; total: number; phrase: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  // Генератор фраз
  const [cols, setCols] = useState<string[]>(["купить\nцена\nзаказать", "натяжной потолок\nнатяжные потолки", "москва\n"]);
  const [match, setMatch] = useState<MatchType>("broad");

  // Черновик хранится только в этом браузере
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s && (s.raw?.length || s.text)) {
        setText(s.text ?? ""); setMasks(s.masks ?? ""); setRegion(s.region ?? "213"); setMinusText(s.minusText ?? "");
        setRemoved(s.removed ?? []); setOff(s.off ?? []); setProduct(s.product ?? ""); setRaw(s.raw ?? []); setDepth(s.depth ?? 50);
        if (s.cols) setCols(s.cols);
      } else {
        setText(DEMO); setMasks(DEMO_MASKS.join("\n")); setProduct("натяжные потолки"); setRaw(parseInput(DEMO)); setIsDemo(true);
      }
    } catch {}
    setReady(true);
    fetch(`${API}?status`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setApi({ enabled: !!d.enabled })).catch(() => {});
  }, []);
  useEffect(() => {
    if (!ready || isDemo) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify({ text: text.length < 1_500_000 ? text : "", masks, region, minusText, removed, off, product, raw: raw.length < 30000 ? raw : [], depth, cols })); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [ready, isDemo, text, masks, region, minusText, removed, off, product, raw, depth, cols]);

  const minus = useMemo(() => splitMinus(minusText), [minusText]);
  const prepared = useMemo(() => prepare(raw), [raw]);
  const rows = useMemo(() => process(prepared, { minus, removed, region, off }), [prepared, minus, removed, region, off]);
  const words = useMemo(() => demandWords(rows, 80), [rows]);
  const cats = useMemo(() => categoryLabels(region), [region]);

  const counts = useMemo(() => {
    const c = { work: 0, filtered: 0, form: 0, removed: 0, all: rows.length } as Record<Tab, number>;
    const byCat: Record<string, number> = {};
    let demand = 0, demandOut = 0;
    for (const r of rows) {
      c[r.status]++;
      if (r.status === "work") demand += r.count ?? 0;
      if (r.status === "filtered" || r.status === "removed") demandOut += r.count ?? 0;
      if (r.status === "filtered" && r.reason) byCat[r.reason] = (byCat[r.reason] ?? 0) + 1;
    }
    return { c, byCat, demand, outShare: demand + demandOut ? Math.round((demandOut / (demand + demandOut)) * 100) : 0 };
  }, [rows]);

  const view = useMemo(() => {
    const nq = normalize(q);
    let list = rows.filter((r) => (tab === "all" || r.status === tab) && (intent === "all" || r.intent === intent) && (!nq || r.key.includes(nq)));
    list = sort === "abc" ? list.sort((a, b) => a.key.localeCompare(b.key, "ru")) : list.sort((a, b) => (b.count ?? -1) - (a.count ?? -1));
    return list;
  }, [rows, tab, intent, sort, q]);

  useEffect(() => setLimit(200), [tab, intent, sort, q]);
  useEffect(() => setStructure(null), [raw]);

  const masksList = useMemo(() => masks.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 10), [masks]);

  function parse(from = text) {
    const r = parseInput(from);
    setIsDemo(false);
    setRaw(r);
    setRemoved([]);
    setTab("work");
    goal("semantics_run", { mode: "paste", rows: r.length });
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function loadDemo() {
    setSource("paste");
    setText(DEMO);
    setMasks(DEMO_MASKS.join("\n"));
    setProduct("натяжные потолки");
    setRegion("213");
    setMinusText("");
    setOff([]);
    parse(DEMO);
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    const buf = await f.arrayBuffer();
    let t = new TextDecoder("utf-8").decode(buf);
    if (t.includes("�")) t = new TextDecoder("windows-1251").decode(buf); // выгрузки из старого Excel
    setText(t.replace(/^﻿/, ""));
    if (fileRef.current) fileRef.current.value = "";
  }

  function addMinus(w: string) {
    if (minus.includes(w)) return;
    setMinusText((s) => (s.trim() ? `${s.trim().replace(/,$/, "")}, ${w}` : w));
  }

  function removeMinus(w: string) {
    setMinusText(minus.filter((m) => m !== w).join(", "));
  }

  function toggleRow(r: Row) {
    if (r.status === "removed" && r.reason === "убрано вручную") setRemoved((x) => x.filter((k) => k !== r.key));
    else if (r.status !== "removed") setRemoved((x) => [...x, r.key]);
  }

  async function copy(kind: string, value: string) {
    try { await navigator.clipboard.writeText(value); } catch {
      const ta = document.createElement("textarea");
      ta.value = value; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    setCopied(kind);
    setTimeout(() => setCopied((k) => (k === kind ? null : k)), 1800);
  }

  const post = useCallback(async (body: Record<string, unknown>, signal?: AbortSignal) => {
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.error || `Ошибка ${r.status}`), { status: r.status, left: d.left });
    return d;
  }, []);

  // Сбор из Вордстата: маски → их хвосты → хвосты самых частых фраз, пока не кончится глубина
  async function collect() {
    if (!masksList.length || !code.trim()) return;
    const ctrl = new AbortController();
    abort.current = ctrl;
    const mset = parseMinus(minus);
    const queue: { phrase: string; parent?: string }[] = masksList.map((m) => ({ phrase: m }));
    const asked = new Set<string>();
    const found = new Map<string, RawRow>();
    let done = 0;
    setApi((a) => ({ ...a, error: undefined }));
    goal("semantics_run", { mode: "api", masks: masksList.length, depth });
    try {
      while (queue.length && done < depth) {
        const item = queue.shift()!;
        const key = normalize(item.phrase);
        if (asked.has(key)) continue;
        asked.add(key);
        setRun({ done, total: depth, phrase: item.phrase });
        const d = await post({ action: "top", code: code.trim(), phrase: item.phrase, region }, ctrl.signal);
        done++;
        setApi((a) => ({ ...a, left: d.left }));
        const res: { phrase: string; count: number }[] = d.results ?? [];
        for (const x of res) {
          const k = normalize(x.phrase);
          const prev = found.get(k);
          if (!prev || (prev.count ?? 0) < x.count) found.set(k, { phrase: x.phrase, count: x.count, parent: prev?.parent ?? (k === key ? undefined : item.phrase) });
        }
        for (const x of d.associations ?? []) {
          const k = normalize(x.phrase);
          if (!found.has(k)) found.set(k, { phrase: x.phrase, count: x.count, parent: item.phrase, assoc: true });
        }
        // Следующий круг: самые частые фразы, которые ещё не спрашивали и не попадают под минус-слова
        const next = res
          .filter((x) => normalize(x.phrase) !== key && !asked.has(normalize(x.phrase)) && x.phrase.split(" ").length <= 5)
          .filter((x) => { const t = normalize(x.phrase).split(" "); return !mset.some((m) => m.test(t, t.map(stem))); })
          .slice(0, 6)
          .map((x) => ({ phrase: x.phrase, parent: item.phrase }));
        queue.push(...next);
        if (done % 3 === 0) setRaw([...found.values()]);
      }
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.name !== "AbortError") setApi((a) => ({ ...a, error: err.message }));
    } finally {
      if (found.size) { setRaw([...found.values()]); setRemoved([]); }
      setRun(null);
      abort.current = null;
      if (found.size) setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  async function checkCode() {
    try {
      const d = await post({ action: "check", code: code.trim() });
      setApi((a) => ({ ...a, left: d.left, error: undefined }));
    } catch (e) {
      setApi((a) => ({ ...a, left: undefined, error: (e as Error).message }));
    }
  }

  function exportXlsx() {
    const head = ["Фраза", "Показы", "Тип", "Через", "Причина"];
    const line = (r: Row) => [r.phrase, r.count, intentLabel(r.intent), r.parent ?? "", r.reason ?? ""];
    const sorted = [...rows].sort((a, b) => (b.count ?? -1) - (a.count ?? -1));
    const sheets = [
      { name: "В работе", rows: [head, ...sorted.filter((r) => r.status === "work").map(line)] },
      { name: "Отсеяно", rows: [head, ...sorted.filter((r) => r.status === "filtered").map(line)] },
      { name: "Словоформы", rows: [head, ...sorted.filter((r) => r.status === "form").map(line)] },
      { name: "Убрано", rows: [head, ...sorted.filter((r) => r.status === "removed").map(line)] },
      { name: "Минус-слова", rows: [["Минус-слово"], ...minus.map((m) => [m])] },
    ];
    if (structure) sheets.splice(1, 0, { name: "Структура", rows: structureRows(structure) });
    download(xlsx(sheets), "semantika.xlsx");
    goal("semantics_export", { format: "xlsx" });
  }

  function exportCsv() {
    download(new Blob([toCsv([...rows].sort((a, b) => (b.count ?? -1) - (a.count ?? -1)))], { type: "text/csv;charset=utf-8" }), "semantika.csv");
    goal("semantics_export", { format: "csv" });
  }

  function reset() {
    setIsDemo(false);
    setRaw([]); setText(""); setRemoved([]); setOff([]); setMinusText(""); setStructure(null); setProduct("");
    try { localStorage.removeItem(STORE); } catch {}
  }

  const multiplied = useMemo(() => multiply(cols.map((c) => c.split("\n")), match), [cols, match]);
  const tabs: { v: Tab; label: string }[] = [
    { v: "work", label: "В работе" }, { v: "filtered", label: "Отсеяно" }, { v: "form", label: "Словоформы" }, { v: "removed", label: "Убрано вами" }, { v: "all", label: "Все" },
  ];

  return (
    <div className="space-y-6">
      {/* ——— Источник ——— */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-xl border bg-background p-5">
          <Segmented<Source>
            label="Откуда берём запросы"
            value={source}
            onChange={setSource}
            options={[
              { v: "paste", label: <><FileText className="size-4" />Свой список</> },
              { v: "api", label: <><Sparkles className="size-4" />Из Вордстата</> },
              { v: "mult", label: <><Network className="size-4" /><span className="hidden sm:inline">Генератор фраз</span><span className="sm:hidden">Фразы</span></> },
            ]}
          />

          {source === "paste" && (
            <div className="mt-5 space-y-4">
              <Field label="Запросы и частоты" htmlFor="sem-text" hint="Строка — запрос. Частота — через табуляцию, точку с запятой или пробел в конце строки. Подходит копия таблицы из wordstat.yandex.ru, выгрузка CSV или Key Collector. Без частот тоже можно.">
                <textarea id="sem-text" value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder={"натяжные потолки	412 000\nнатяжные потолки цена	98 000\nнатяжной потолок купить	14 200"} className={cn(areaCls, "font-mono text-[13px]")} spellCheck={false} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => parse()} disabled={!text.trim()}>Разобрать запросы</Button>
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Upload />Загрузить CSV или TXT</Button>
                <Button type="button" variant="ghost" onClick={loadDemo}>Пример: натяжные потолки</Button>
                <input ref={fileRef} type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
              </div>
            </div>
          )}

          {source === "api" && (
            <div className="mt-5 space-y-4">
              {!api.enabled && (
                <div className="flex gap-3 rounded-lg border border-brand/30 bg-brand-bg p-4 text-sm">
                  <Lock className="mt-0.5 size-4 shrink-0 text-brand" />
                  <div>
                    <p className="font-medium">Сбор из Вордстата — платная опция, подключаю</p>
                    <p className="mt-1 text-muted-foreground">Инструмент сам соберёт все запросы ниши по маскам с частотами за последние 30 дней. Пока доступ выдаю по заявке. Бесплатно уже работает разбор своего списка: соберите запросы в wordstat.yandex.ru и вставьте во вкладку «Свой список».</p>
                    <a href={site.telegram} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-medium text-brand hover:underline">Оставить заявку в Telegram</a>
                  </div>
                </div>
              )}
              <Field label="Маски — строка на маску, до 10" htmlFor="sem-masks" hint="Маска — 1⁠–⁠3 слова, с которых начинается спрос: «натяжной потолок», «кондиционер». Инструмент соберёт хвосты каждой маски, затем хвосты самых частых фраз.">
                <textarea id="sem-masks" value={masks} onChange={(e) => setMasks(e.target.value)} rows={4} placeholder={"натяжные потолки\nнатяжной потолок"} className={areaCls} disabled={!api.enabled} />
              </Field>
              <fieldset className="space-y-1.5" disabled={!api.enabled}>
                <legend className="mb-1 text-sm font-medium">Глубина сбора</legend>
                <Segmented label="Глубина сбора" value={depth} onChange={setDepth} options={DEPTHS.map((d) => ({ v: d.v, label: d.label }))} />
                <p className="text-xs text-muted-foreground">{DEPTHS.find((d) => d.v === depth)?.hint}. Один ответ Вордстата — до 2000 фраз.</p>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field label="Код доступа" htmlFor="sem-code" hint={api.left != null ? `Осталось запросов по коду: ${fmt(api.left)}` : "Код приходит после оплаты."}>
                  <input id="sem-code" value={code} onChange={(e) => setCode(e.target.value)} onBlur={() => code.trim() && api.enabled && checkCode()} placeholder="XXXX-XXXX" className={inputCls} disabled={!api.enabled} autoComplete="off" />
                </Field>
                {run ? (
                  <Button type="button" variant="outline" onClick={() => abort.current?.abort()}><X />Остановить</Button>
                ) : (
                  <Button type="button" onClick={collect} disabled={!api.enabled || !masksList.length || !code.trim()}>Собрать семантику</Button>
                )}
              </div>
              {run && (
                <div className="space-y-1.5" aria-live="polite">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${Math.round((run.done / run.total) * 100)}%` }} /></div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Запрос {run.done + 1} из {run.total}: «{run.phrase}» · собрано {fmt(raw.length)} фраз</p>
                </div>
              )}
              {api.error && <p className="text-sm text-red-600 dark:text-red-400">{api.error}</p>}
            </div>
          )}

          {source === "mult" && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">Перемножает списки слов во все сочетания: «купить» × «натяжной потолок» × «москва». Так собирают маски для Вордстата и ключи для Яндекс Директа.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {cols.map((c, i) => (
                  <Field key={i} label={`Список ${i + 1}`} htmlFor={`sem-col-${i}`}>
                    <textarea id={`sem-col-${i}`} value={c} onChange={(e) => setCols((x) => x.map((v, j) => (j === i ? e.target.value : v)))} rows={6} className={areaCls} />
                  </Field>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Тип соответствия</p>
                <Segmented<MatchType> label="Тип соответствия" value={match} onChange={setMatch} options={[{ v: "broad", label: "Широкое" }, { v: "quotes", label: "«Фразовое»" }, { v: "order", label: "[Порядок]" }, { v: "fix", label: "!Форма" }]} />
              </div>
              <Field label={`Готовые фразы: ${fmt(multiplied.length)}`} htmlFor="sem-mult">
                <textarea id="sem-mult" value={multiplied.join("\n")} readOnly rows={6} className={cn(areaCls, "font-mono text-[13px]")} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => copy("mult", multiplied.join("\n"))} disabled={!multiplied.length}>{copied === "mult" ? <Check /> : <Copy />}Скопировать</Button>
                <Button type="button" variant="outline" onClick={() => { setMasks(multiply(cols.map((c) => c.split("\n"))).slice(0, 10).join("\n")); setSource("api"); }} disabled={!multiplied.length}>Взять первые 10 как маски</Button>
                <Button type="button" variant="ghost" onClick={() => download(new Blob(["﻿" + multiplied.join("\r\n")], { type: "text/plain;charset=utf-8" }), "frazy.txt")} disabled={!multiplied.length}>Скачать TXT</Button>
              </div>
            </div>
          )}
        </div>

        {/* ——— Настройки отсева ——— */}
        <div className="space-y-4 rounded-xl border bg-background p-5">
          <Field label="Регион" htmlFor="sem-region" hint="Запросы с другими городами уйдут в отсев. Для «Россия» города не отсеиваются.">
            <Select id="sem-region" value={region} onChange={setRegion}>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </Select>
          </Field>
          <Field label="Минус-слова · необязательно" htmlFor="sem-minus" hint={<>Через запятую. Слово убирает все свои формы, <code className="rounded bg-muted px-1">авто*</code> — всё, что начинается с «авто», <code className="rounded bg-muted px-1">!слово</code> — только эту форму.</>}>
            <textarea id="sem-minus" value={minusText} onChange={(e) => setMinusText(e.target.value)} rows={4} placeholder="бесплатно, своими руками, вакансии" className={areaCls} />
          </Field>
          {minus.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => copy("minus", minus.map((m) => `-${m.replace(/\s+/g, " -")}`).join(" "))}>{copied === "minus" ? <Check /> : <Copy />}Для Директа</Button>
              <span className="text-xs text-muted-foreground">{plural(minus.length, "минус-слово", "минус-слова", "минус-слов")}</span>
            </div>
          )}
        </div>
      </div>

      {/* ——— Результаты ——— */}
      {raw.length > 0 && (
        <div ref={resultsRef} className="scroll-mt-24 space-y-6">
          {isDemo && (
            <div className="flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand-bg p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm"><span className="font-medium">Это пример</span> — запросы про натяжные потолки уже почищены и разобраны. Вставьте свои запросы выше или соберите их из Вордстата.</p>
              <Button type="button" variant="outline" size="sm" onClick={reset} className="shrink-0">Убрать пример</Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Запросов собрано" value={fmt(rows.length)} />
            <Stat label="В работе" value={fmt(counts.c.work)} hint={counts.demand ? `${fmt(counts.demand)} показов` : undefined} />
            <Stat label="Отсеяно спроса" value={`${counts.outShare}%`} hint={plural(counts.c.filtered + counts.c.removed, "фраза", "фразы", "фраз")} />
            <Stat label="Словоформы" value={fmt(counts.c.form)} hint="склеены с основной фразой" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Таблица */}
            <div className="min-w-0 rounded-xl border bg-background">
              <div className="space-y-3 border-b p-4">
                <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5" role="tablist" aria-label="Статус запросов">
                  {tabs.map((t) => (
                    <button key={t.v} type="button" role="tab" aria-selected={tab === t.v} onClick={() => setTab(t.v)} className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm transition-colors", tab === t.v ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground")}>
                      {t.label}<span className="tabular-nums text-xs text-muted-foreground">{fmt(counts.c[t.v])}</span>
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_170px_150px]">
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти в запросах" aria-label="Найти в запросах" className={inputCls} />
                  <Select id="sem-intent" value={intent} onChange={(v) => setIntent(v as Intent | "all")}>
                    <option value="all">Все типы</option>
                    {INTENTS.map((i) => <option key={i.v} value={i.v}>{i.label}</option>)}
                  </Select>
                  <Select id="sem-sort" value={sort} onChange={(v) => setSort(v as "count" | "abc")}>
                    <option value="count">По показам</option>
                    <option value="abc">По алфавиту</option>
                  </Select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-normal">Фраза</th>
                      <th className="px-2 py-2 text-right font-normal">Показы</th>
                      <th className="hidden px-2 py-2 font-normal sm:table-cell">Тип</th>
                      <th className="w-10 px-2 py-2"><span className="sr-only">Действие</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.slice(0, limit).map((r) => (
                      <tr key={r.key} className="group border-b last:border-0 hover:bg-accent/50">
                        <td className="px-4 py-2 align-top">
                          <span className={cn(r.status !== "work" && "text-muted-foreground")}>{r.phrase}</span>
                          {(r.reason || r.parent) && <span className="mt-0.5 block text-xs text-muted-foreground">{r.reason ?? `через «${r.parent}»`}</span>}
                        </td>
                        <td className="px-2 py-2 text-right align-top tabular-nums">{fmt(r.count)}</td>
                        <td className="hidden px-2 py-2 align-top sm:table-cell"><Badge variant={r.intent === "commercial" ? "accent" : "default"}>{intentLabel(r.intent)}</Badge></td>
                        <td className="px-2 py-1.5 text-right align-top">
                          {(r.status !== "removed" || r.reason === "убрано вручную") && (
                            <button type="button" onClick={() => toggleRow(r)} aria-label={r.status === "removed" ? `Вернуть «${r.phrase}»` : `Убрать «${r.phrase}»`} title={r.status === "removed" ? "Вернуть" : "Убрать фразу"} className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-60 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100">
                              {r.status === "removed" ? <Undo2 className="size-3.5" /> : <X className="size-3.5" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!view.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Здесь пусто</td></tr>}
                  </tbody>
                </table>
              </div>
              {view.length > limit && (
                <div className="border-t p-3 text-center">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLimit((l) => l + 500)}>Показать ещё · осталось {fmt(view.length - limit)}</Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2 border-t p-4">
                <Button type="button" onClick={exportXlsx}><FileSpreadsheet />Скачать Excel</Button>
                <Button type="button" variant="outline" onClick={exportCsv}>CSV</Button>
                <Button type="button" variant="outline" onClick={() => copy("work", rows.filter((r) => r.status === "work").sort((a, b) => (b.count ?? -1) - (a.count ?? -1)).map((r) => r.phrase).join("\n"))}>{copied === "work" ? <Check /> : <Copy />}Копировать фразы в работе</Button>
                <Button type="button" variant="ghost" onClick={reset}><RotateCcw />Очистить</Button>
              </div>
            </div>

            {/* Боковая панель */}
            <div className="space-y-6">
              <div className="rounded-xl border bg-background p-5">
                <h3 className="font-semibold">Что отсеяно</h3>
                <p className="mt-1 text-xs text-muted-foreground">Выключите категорию — её запросы вернутся в работу.</p>
                <div className="mt-4 space-y-3">
                  {cats.filter((c) => c.id !== "assoc" || raw.some((r) => r.assoc)).map((c) => (
                    <Toggle key={c.id} checked={!off.includes(c.id)} onChange={(v) => setOff((x) => (v ? x.filter((i) => i !== c.id) : [...x, c.id]))} label={c.label} hint={plural(counts.byCat[c.label] ?? 0, "фраза", "фразы", "фраз")} />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-background p-5">
                <h3 className="font-semibold">Слова спроса</h3>
                <p className="mt-1 text-xs text-muted-foreground">Слова из запросов в работе. «−» добавляет слово в минус-слова, таблица обновится сразу.</p>
                {minus.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {minus.map((m) => (
                      <button key={m} type="button" onClick={() => removeMinus(m)} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground" aria-label={`Убрать минус-слово «${m}»`}>−{m}<X className="size-3" /></button>
                    ))}
                  </div>
                )}
                <ul className="mt-3 max-h-[420px] space-y-0.5 overflow-y-auto pr-1 text-sm">
                  {words.map((w) => (
                    <li key={w.stem} className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-accent/50">
                      <button type="button" onClick={() => addMinus(w.word)} aria-label={`В минус-слова: ${w.word}`} title="В минус-слова" className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><MinusIcon className="size-3.5" /></button>
                      <span className="min-w-0 flex-1 truncate">{w.word}</span>
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{fmt(w.phrases)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Структура сайта */}
          <div className="rounded-xl border bg-background p-5">
            <h3 className="text-lg font-semibold tracking-tight">Структура сайта из запросов</h3>
            <p className="mt-1 text-sm text-muted-foreground">Инструмент сгруппирует запросы в работе по страницам: главная, страницы по видам и уточнениям, статьи блога для информационных запросов. Повторный сбор не нужен.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Что продаёте" htmlFor="sem-product" hint="Главные слова ниши. Без них инструмент возьмёт два самых частых слова.">
                <input id="sem-product" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="натяжные потолки" className={inputCls} />
              </Field>
              <Button type="button" onClick={() => { setStructure(buildStructure(rows, product, masksList)); goal("semantics_structure"); }} disabled={!counts.c.work}>Построить структуру</Button>
            </div>
            {structure && (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {([["Коммерческие страницы", structure.commercial], ["Блог: статьи", structure.blog]] as const).map(([title, pages]) => (
                  <div key={title}>
                    <p className="mb-2 text-sm font-medium">{title} <span className="text-muted-foreground">· {pages.length}</span></p>
                    {!pages.length && <p className="text-sm text-muted-foreground">Нет запросов этого типа.</p>}
                    <div className="divide-y rounded-lg border">
                      {pages.map((p, i) => (
                        <details key={`${p.name}-${i}`} className="group px-3 py-2">
                          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm [&::-webkit-details-marker]:hidden">
                            <ChevronDown className="size-3.5 shrink-0 -rotate-90 text-muted-foreground transition-transform group-open:rotate-0" />
                            <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                            <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{fmt(p.phrases.length)} · {fmt(p.demand)}</span>
                          </summary>
                          <ul className="mt-2 space-y-0.5 pb-1 pl-5 text-sm">
                            {p.phrases.slice(0, 30).map((r) => (
                              <li key={r.key} className="flex gap-2"><span className="min-w-0 flex-1 text-muted-foreground">{r.phrase}</span><span className="tabular-nums text-xs text-muted-foreground">{fmt(r.count)}</span></li>
                            ))}
                            {p.phrases.length > 30 && <li className="text-xs text-muted-foreground">и ещё {fmt(p.phrases.length - 30)} — в Excel</li>}
                          </ul>
                        </details>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="lg:col-span-2">
                  <Button type="button" variant="outline" onClick={exportXlsx}><FileSpreadsheet />Скачать Excel со структурой</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
