"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, ExternalLink, FileUp, Link2, QrCode, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { Card, Field, Toggle, inputCls } from "@/components/privacy-generator";
import { buildUtmUrl, bulkInput, presets, splitUtmUrl, toCsv, utmFields, type UtmKey, type UtmValues } from "@/lib/utm";
import { buildSvg, canvasBlob, downloadBlob, makeMatrix, svgToCanvas } from "@/lib/qr";

const empty: UtmValues = { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "", utm_term: "" };
const STORE = "nikalimp-utm-v1";
const HISTORY = "nikalimp-utm-history-v1";
const HISTORY_MAX = 20;
const BULK_MAX = 500;

type Mode = "single" | "bulk";
type State = { url: string; preset: string; values: UtmValues; lowercase: boolean; translit: boolean };
const initial: State = { url: "", preset: "custom", values: empty, lowercase: true, translit: true };

// Короткие имена в адресе страницы: настоящие utm_* в адресе nikalimp.ru Метрика приняла бы за метки визита.
const qKeys: Record<UtmKey, string> = { utm_source: "s", utm_medium: "m", utm_campaign: "c", utm_content: "ct", utm_term: "t" };

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? { ...fallback, ...JSON.parse(raw) } : fallback; } catch { return fallback; }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* приватный режим — работаем без сохранения */ }
}
function loadHistory(): string[] {
  try { const v = JSON.parse(localStorage.getItem(HISTORY) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, HISTORY_MAX) : []; } catch { return []; }
}

function stateToQuery(s: State): string {
  const q = new URLSearchParams();
  if (s.url) q.set("u", s.url);
  if (s.preset !== "custom") q.set("p", s.preset);
  for (const f of utmFields) if (s.values[f.key]) q.set(qKeys[f.key], s.values[f.key]);
  if (!s.lowercase) q.set("lc", "0");
  if (!s.translit) q.set("tr", "0");
  return q.toString();
}
function queryToState(search: string): State | null {
  const q = new URLSearchParams(search);
  const has = ["u", "p", ...Object.values(qKeys)].some((k) => q.has(k));
  if (!has) return null;
  const values = { ...empty };
  for (const f of utmFields) values[f.key] = q.get(qKeys[f.key]) ?? "";
  const p = q.get("p") ?? "custom";
  return { url: q.get("u") ?? "", preset: presets.some((x) => x.id === p) ? p : "custom", values, lowercase: q.get("lc") !== "0", translit: q.get("tr") !== "0" };
}

function CopyButton({ text, label, primary = false, onCopied, icon }: { text: string; label: string; primary?: boolean; onCopied?: () => void; icon?: React.ReactNode }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); onCopied?.(); setTimeout(() => setDone(false), 1600); } catch { /* нет доступа к буферу */ }
  };
  return (
    <button type="button" onClick={copy} disabled={!text}
      className={(primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border bg-background hover:bg-accent") + " inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium disabled:opacity-50"}>
      {done ? <Check className="size-4" /> : icon ?? <Copy className="size-4" />}{done ? "Скопировано" : label}
    </button>
  );
}

function IconCopy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label={label} title={label} onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); } catch { /* нет буфера */ } }}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-accent">
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function Tabs({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const items: { id: Mode; label: string }[] = [{ id: "single", label: "Одна ссылка" }, { id: "bulk", label: "Списком" }];
  return (
    <div role="tablist" aria-label="Режим" className="inline-flex rounded-lg border bg-background p-1">
      {items.map((i) => (
        <button key={i.id} type="button" role="tab" aria-selected={value === i.id} onClick={() => onChange(i.id)}
          className={(value === i.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground") + " rounded-md px-4 py-1.5 text-sm font-medium"}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

function MiniQr({ link }: { link: string }) {
  const svg = useMemo(() => {
    const m = makeMatrix(link, "M");
    return m ? buildSvg(m, { fg: "#111111", bg: "#ffffff", style: "square", margin: 4 }) : "";
  }, [link]);
  if (!svg) return null;
  const png = async () => {
    try { downloadBlob(await canvasBlob(await svgToCanvas(svg, 1024, "#ffffff", false)), "utm-qr.png"); } catch { /* холст недоступен */ }
  };
  return (
    <div className="mt-4 flex gap-4 border-t pt-4">
      <div role="img" aria-label="QR-код ссылки с метками" className="size-28 shrink-0 overflow-hidden rounded-md border [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-medium">QR-код этой ссылки</p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={png} className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium hover:bg-accent"><Download className="size-3.5" />PNG</button>
          <button type="button" onClick={() => downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "utm-qr.svg")} className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium hover:bg-accent"><Download className="size-3.5" />SVG</button>
        </div>
        <a href={`/qr-generator/?text=${encodeURIComponent(link)}`} className="inline-flex items-center gap-1 text-xs text-brand hover:underline"><QrCode className="size-3.5" />Логотип и цвета — в генераторе QR</a>
      </div>
    </div>
  );
}

export function UtmGenerator() {
  const [s, setS] = useState<State>(initial);
  const [mode, setMode] = useState<Mode>("single");
  const [history, setHistory] = useState<string[]>([]);
  const [bulk, setBulk] = useState("");
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let fromQuery: State | null = null;
    try { fromQuery = queryToState(window.location.search); } catch { /* адрес без параметров */ }
    setS(fromQuery ?? load(STORE, initial));
    setHistory(loadHistory());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    save(STORE, s);
    try {
      const q = stateToQuery(s);
      const next = window.location.pathname + (q ? "?" + q : "") + window.location.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) window.history.replaceState(window.history.state, "", next);
    } catch { /* история браузера недоступна */ }
  }, [s, loaded]);

  const preset = presets.find((p) => p.id === s.preset) ?? presets[0];
  const result = useMemo(() => buildUtmUrl(s.url, s.values, { lowercase: s.lowercase, translit: s.translit }), [s]);
  const ready = result.errors.length === 0 && result.url;
  const configLink = loaded ? `${window.location.origin}${window.location.pathname}?${stateToQuery(s)}` : "";

  const rows = useMemo(() => {
    if (mode !== "bulk" || !bulk.trim()) return [];
    return bulkInput(bulk, s.values, BULK_MAX).map((r) => ({ ...r, res: buildUtmUrl(r.url, r.values, { lowercase: s.lowercase, translit: s.translit }) }));
  }, [mode, bulk, s]);
  const okRows = rows.filter((r) => r.res.errors.length === 0 && r.res.url);

  const setValue = (k: UtmKey, v: string) => setS((p) => ({ ...p, values: { ...p.values, [k]: v } }));
  const choose = (id: string) => {
    const pr = presets.find((p) => p.id === id) ?? presets[0];
    setS((p) => ({ ...p, preset: id, values: { ...empty, ...(id === "custom" ? p.values : pr.values) } }));
  };
  const writeHistory = (fn: (h: string[]) => string[]) => setHistory((h) => { const next = fn(h).slice(0, HISTORY_MAX); save(HISTORY, next); return next; });
  const remember = (link: string) => { if (link) writeHistory((h) => [link, ...h.filter((x) => x !== link)]); };
  const reuse = (link: string) => {
    const { url, values } = splitUtmUrl(link);
    setS((p) => ({ ...p, url, values, preset: "custom" }));
    setMode("single");
    document.getElementById("utm-url")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onFile = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setBulk(String(r.result ?? ""));
    r.readAsText(f, "utf-8");
  };
  const downloadCsv = () => {
    const out = [["url", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "link"],
      ...rows.map((r) => [r.url, ...utmFields.map((f) => r.values[f.key]), r.res.errors.length ? "" : r.res.url])];
    downloadBlob(new Blob([toCsv(out)], { type: "text/csv;charset=utf-8" }), "utm-links.csv");
  };

  return (
    <div className="space-y-6">
      <Tabs value={mode} onChange={setMode} />
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
        <div className="space-y-6">
          {mode === "single" ? (
            <Card step={1} title="Страница">
              <Field label="Адрес страницы" htmlFor="utm-url" hint="Можно без https:// — добавлю сам. Свои параметры и якорь #форма сохранятся.">
                <input id="utm-url" value={s.url} onChange={(e) => setS((p) => ({ ...p, url: e.target.value }))} placeholder="nikalimp.ru/services/personal-website/" inputMode="url" className={inputCls} />
              </Field>
            </Card>
          ) : (
            <Card step={1} title="Список ссылок" aside={<button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><FileUp className="size-3.5" />Загрузить CSV</button>}>
              <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
              <Field label="Одна строка — одна ссылка" htmlFor="utm-bulk" hint={<>Колонки: url, source, medium, campaign, content, term. Заголовок необязателен, разделитель — запятая или точка с запятой. Пустые ячейки возьму из меток ниже: можно вставить одни адреса. До {BULK_MAX} строк.</>}>
                <textarea id="utm-bulk" value={bulk} onChange={(e) => setBulk(e.target.value)} rows={8} spellCheck={false}
                  placeholder={"nikalimp.ru/;vk;cpc;spring;banner_1\nnikalimp.ru/blog/;vk;cpc;spring;banner_2"} className={inputCls + " h-auto py-2 font-mono text-xs"} />
              </Field>
            </Card>
          )}

          <Card step={2} title="Источник трафика">
            <div role="radiogroup" aria-label="Источник трафика" className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={s.preset === p.id} onClick={() => choose(p.id)}
                  className={(s.preset === p.id ? "border-brand bg-brand-bg text-brand" : "bg-background hover:bg-accent") + " rounded-md border px-3 py-1.5 text-sm"}>
                  {p.label}
                </button>
              ))}
            </div>
            {preset.note && <p className="text-xs leading-relaxed text-muted-foreground">{preset.note}</p>}
          </Card>

          <Card step={3} title={mode === "bulk" ? "Метки по умолчанию" : "Метки"} aside={<button type="button" onClick={() => setS((p) => ({ ...p, values: empty, preset: "custom" }))} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="size-3.5" />Очистить</button>}>
            <div className="grid gap-4 sm:grid-cols-2">
              {utmFields.map((f) => (
                <Field key={f.key} htmlFor={`utm-${f.key}`} label={`${f.label} · ${f.key}${f.required ? " *" : ""}`} hint={f.hint}>
                  <input id={`utm-${f.key}`} value={s.values[f.key]} onChange={(e) => setValue(f.key, e.target.value)} placeholder={f.placeholder} className={inputCls} />
                </Field>
              ))}
            </div>
            {preset.macros && (
              <div>
                <p className="text-sm font-medium">Динамические параметры {preset.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Площадка сама подставит значение при клике. Нажмите, чтобы добавить в «Объявление».</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {preset.macros.map((m) => (
                    <li key={m.code}>
                      <button type="button" title={m.text} onClick={() => setValue("utm_content", s.values.utm_content ? `${s.values.utm_content}_${m.code}` : m.code)}
                        className="rounded-md border bg-card px-2 py-0.5 font-mono text-xs hover:bg-accent">{m.code}<span className="ml-1.5 font-sans text-muted-foreground">{m.text}</span></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card step={4} title="Настройки">
            <Toggle checked={s.translit} onChange={(v) => setS((p) => ({ ...p, translit: v }))} label="Транслитерация" hint="«весна скидки» → vesna_skidki. Без неё кириллица кодируется в %D0%B2…" />
            <Toggle checked={s.lowercase} onChange={(v) => setS((p) => ({ ...p, lowercase: v }))} label="Нижний регистр" hint="Метрика различает Yandex и yandex — регистр лучше держать одинаковым." />
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          {mode === "single" ? (
            <div className="rounded-xl border bg-background p-5">
              <h2 className="font-semibold">Готовая ссылка</h2>
              <output htmlFor="utm-url" aria-live="polite" className="mt-3 block min-h-24 break-all rounded-md border bg-card p-3 font-mono text-[13px] leading-relaxed">
                {result.url || <span className="font-sans text-muted-foreground">Заполните адрес и метки — ссылка появится здесь.</span>}
              </output>
              {result.errors.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{result.errors.map((e) => <li key={e}>• {e}</li>)}</ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton text={ready ? result.url : ""} label="Копировать ссылку" primary onCopied={() => remember(result.url)} />
                <CopyButton text={result.query} label="Только метки" />
                {ready && <a href={result.url} target="_blank" rel="noopener nofollow" onClick={() => remember(result.url)} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-accent"><ExternalLink className="size-4" />Открыть</a>}
              </div>
              {ready && <MiniQr link={result.url} />}
              <div className="mt-4 border-t pt-4">
                <CopyButton text={configLink} label="Скопировать ссылку на настройки" icon={<Link2 className="size-4" />} />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Коллега откроет генератор с теми же адресом и метками. Всё считается в браузере: ссылки никуда не отправляются.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-background p-5">
              <h2 className="font-semibold">Ссылки с метками</h2>
              <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                {rows.length ? `Готово ${okRows.length} из ${rows.length}` : "Вставьте список или загрузите CSV — ссылки появятся здесь."}
              </p>
              {rows.length > 0 && (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <CopyButton text={okRows.map((r) => r.res.url).join("\n")} label="Копировать все" primary />
                    <button type="button" onClick={downloadCsv} className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent"><Download className="size-4" />Скачать CSV</button>
                  </div>
                  <div className="mt-4 max-h-[28rem] overflow-auto rounded-md border">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-card text-muted-foreground">
                        <tr><th className="w-8 p-2 font-medium">#</th><th className="p-2 font-medium">Ссылка</th><th className="w-10 p-2" /></tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map((r, i) => (
                          <tr key={i} className="align-top">
                            <td className="p-2 tabular-nums text-muted-foreground">{i + 1}</td>
                            <td className="break-all p-2 font-mono">
                              {r.res.errors.length ? <span className="font-sans text-amber-600 dark:text-amber-400">{r.url || "Нет адреса"} — {r.res.errors.join(" ")}</span> : r.res.url}
                            </td>
                            <td className="p-1.5">{!r.res.errors.length && <IconCopy text={r.res.url} label={`Копировать ссылку ${i + 1}`} />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">CSV сохраняется с разделителем «;» — файл сразу открывается колонками в Excel.</p>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-4 rounded-xl border bg-background p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Последние ссылки</h2>
                <button type="button" onClick={() => writeHistory(() => [])} className="text-xs text-muted-foreground hover:text-foreground">Очистить всё</button>
              </div>
              <ul className="mt-3 space-y-2">
                {history.map((h) => (
                  <li key={h} className="flex items-start gap-1.5">
                    <span className="min-w-0 flex-1 break-all pt-1 font-mono text-xs text-muted-foreground">{h}</span>
                    <IconCopy text={h} label="Копировать" />
                    <button type="button" aria-label="Взять в работу" title="Взять в работу" onClick={() => reuse(h)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-accent"><Undo2 className="size-3.5" /></button>
                    <button type="button" aria-label="Удалить из истории" title="Удалить" onClick={() => writeHistory((x) => x.filter((y) => y !== h))} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border bg-background hover:bg-accent"><Trash2 className="size-3.5" /></button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Хранится в этом браузере, до {HISTORY_MAX} ссылок.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
