"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Card, Field, Toggle, inputCls } from "@/components/privacy-generator";
import {
  buildSvg, canvasBlob, contrast, downloadBlob, emptyData, fileSlug, luminance, makeMatrix, payload, qrVersion, svgToCanvas, verifyScan,
  type LogoShape, type ModuleStyle, type QrData, type QrKind, type ScanResult,
} from "@/lib/qr";
import { makeZip } from "@/lib/zip";

const kinds: { id: QrKind; label: string }[] = [
  { id: "url", label: "Ссылка" },
  { id: "vcard", label: "Визитка" },
  { id: "telegram", label: "Telegram" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "text", label: "Текст" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Телефон" },
];
const styles: { id: ModuleStyle; label: string }[] = [
  { id: "square", label: "Квадраты" },
  { id: "rounded", label: "Скруглённые" },
  { id: "dots", label: "Точки" },
];
const sizes = [512, 1024, 2048];
const STORE = "nikalimp-qr-v1";
const SAMPLE = "https://nikalimp.ru/";
const BATCH_MAX = 100;
const DENSE_VERSION = 10; // от 57×57 точек код на визитке уже трудно считать

type Mode = "single" | "batch";
type State = { kind: QrKind; data: QrData; fg: string; bg: string; style: ModuleStyle; margin: number; shape: LogoShape; scale: number; px: number };
const initial: State = { kind: "url", data: emptyData, fg: "#111111", bg: "#ffffff", style: "square", margin: 4, shape: "circle", scale: 0.22, px: 1024 };

function Choice<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((i) => (
        <button key={i.id} type="button" role="radio" aria-checked={value === i.id} onClick={() => onChange(i.id)}
          className={(value === i.id ? "border-brand bg-brand-bg text-brand" : "bg-background hover:bg-accent") + " rounded-md border px-3 py-1.5 text-sm"}>{i.label}</button>
      ))}
    </div>
  );
}

function Tabs({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const items: { id: Mode; label: string }[] = [{ id: "single", label: "Один код" }, { id: "batch", label: "Пачкой" }];
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

/** Строка пачки: адрес без протокола дополняем https://, остальное кодируем как есть. */
const batchValue = (line: string) => (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(line) && !/^\d+(\.\d+)*$/.test(line) ? "https://" + line : line);

const scanText: Record<ScanResult | "checking", { text: string; tone: "ok" | "warn" | "muted" }> = {
  checking: { text: "Проверяю, считывается ли код…", tone: "muted" },
  ok: { text: "Код считывается ✓", tone: "ok" },
  mismatch: { text: "Код считывается, но текст другой. Проверьте данные и перескачайте.", tone: "warn" },
  unreadable: { text: "Браузер не смог считать код. Уменьшите картинку в центре или сделайте цвета контрастнее.", tone: "warn" },
  unsupported: { text: "Перед печатью проверьте код камерой телефона: этот браузер не умеет считывать QR сам.", tone: "muted" },
};

export function QrGenerator() {
  const [s, setS] = useState<State>(initial);
  const [mode, setMode] = useState<Mode>("single");
  const [batch, setBatch] = useState("");
  const [batchFmt, setBatchFmt] = useState<"png" | "svg">("png");
  const [zipping, setZipping] = useState(false);
  const [logo, setLogo] = useState<string | null>(null); // data URL — только в памяти вкладки, никуда не отправляется
  const [logoName, setLogoName] = useState("");
  const [scan, setScan] = useState<ScanResult | "checking">("checking");
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let next = initial;
    try { const raw = localStorage.getItem(STORE); if (raw) next = { ...initial, ...JSON.parse(raw) }; } catch { /* без хранилища */ }
    try {
      const t = new URLSearchParams(window.location.search).get("text");
      if (t) next = /^https?:\/\//i.test(t) ? { ...next, kind: "url", data: { ...next.data, url: t } } : { ...next, kind: "text", data: { ...next.data, text: t } };
    } catch { /* адрес без параметров */ }
    setS(next);
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* приватный режим */ } }, [s, loaded]);

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setD = <K extends keyof QrData>(k: K, v: QrData[K]) => setS((p) => ({ ...p, data: { ...p.data, [k]: v } }));

  const own = payload(s.kind, s.data);
  const sample = !own;
  const text = own || SAMPLE;
  const ecc = logo ? "H" : "M";
  const svgOpts = { fg: s.fg, bg: s.bg, style: s.style, margin: s.margin, logo: logo ? { src: logo, shape: s.shape, scale: s.scale } : undefined };
  const matrix = useMemo(() => makeMatrix(text, ecc), [text, ecc]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const svg = useMemo(() => (matrix ? buildSvg(matrix, svgOpts) : ""), [matrix, s.fg, s.bg, s.style, s.margin, s.shape, s.scale, logo]);
  const ratio = contrast(s.fg, s.bg);
  const inverted = luminance(s.fg) > luminance(s.bg);
  const version = matrix ? qrVersion(matrix.size) : 0;
  const smooth = s.style !== "square";

  // Проверка считывания: ждём паузу в наборе, рисуем код и читаем встроенным распознавателем браузера
  useEffect(() => {
    if (mode !== "single" || !svg) return;
    let alive = true;
    setScan("checking");
    const id = setTimeout(() => { verifyScan(svg, s.bg, text, smooth).then((r) => { if (alive) setScan(r); }); }, 500);
    return () => { alive = false; clearTimeout(id); };
  }, [svg, text, s.bg, smooth, mode]);

  const lines = useMemo(() => batch.split(/\r?\n/).map((l) => l.trim()).filter(Boolean), [batch]);
  const items = useMemo(() => {
    if (mode !== "batch") return [];
    return lines.slice(0, BATCH_MAX).map((line, i) => {
      const value = batchValue(line);
      const m = makeMatrix(value, ecc);
      return { value, name: `${String(i + 1).padStart(3, "0")}-${fileSlug(value)}`, svg: m ? buildSvg(m, svgOpts) : "" };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lines, ecc, s.fg, s.bg, s.style, s.margin, s.shape, s.scale, logo]);
  const goodItems = items.filter((i) => i.svg);

  const onFile = (f?: File) => {
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => { setLogo(String(r.result)); setLogoName(f.name); };
    r.readAsDataURL(f);
  };

  const saveSvg = () => downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "qr-code.svg");
  const saveRaster = async (type: "image/png" | "image/jpeg") => {
    try { downloadBlob(await canvasBlob(await svgToCanvas(svg, s.px, s.bg, smooth), type), type === "image/png" ? "qr-code.png" : "qr-code.jpg"); } catch { /* холст недоступен */ }
  };
  const saveZip = async () => {
    setZipping(true);
    try {
      const enc = new TextEncoder();
      const files: { name: string; data: Uint8Array }[] = [];
      for (const it of goodItems) {
        const data = batchFmt === "svg"
          ? enc.encode(it.svg)
          : new Uint8Array(await (await canvasBlob(await svgToCanvas(it.svg, s.px, s.bg, smooth))).arrayBuffer());
        files.push({ name: `${it.name}.${batchFmt}`, data });
      }
      downloadBlob(makeZip(files), "qr-codes.zip");
    } catch { /* холст недоступен */ } finally { setZipping(false); }
  };

  const tone = { ok: "text-emerald-700 dark:text-emerald-400", warn: "text-amber-600 dark:text-amber-400", muted: "text-muted-foreground" };
  const d = s.data;
  return (
    <div className="space-y-6">
      <Tabs value={mode} onChange={setMode} />
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,24rem)]">
        <div className="space-y-6">
          {mode === "single" ? (
            <Card step={1} title="Что зашифровать">
              <Choice items={kinds} value={s.kind} onChange={(v) => set("kind", v)} label="Тип QR-кода" />
              {s.kind === "url" && <Field label="Ссылка" htmlFor="qr-url" hint="Можно без https://. Для рекламы добавьте UTM-метки — генератор меток есть в продуктах."><input id="qr-url" value={d.url} onChange={(e) => setD("url", e.target.value)} placeholder="nikalimp.ru" inputMode="url" className={inputCls} /></Field>}
              {s.kind === "text" && <Field label="Текст" htmlFor="qr-text"><textarea id="qr-text" value={d.text} onChange={(e) => setD("text", e.target.value)} rows={4} className={inputCls + " h-auto py-2"} /></Field>}
              {s.kind === "telegram" && <Field label="Канал или аккаунт" htmlFor="qr-tg" hint="@username или ссылка t.me"><input id="qr-tg" value={d.tg} onChange={(e) => setD("tg", e.target.value)} placeholder="@nikalimp" className={inputCls} /></Field>}
              {s.kind === "phone" && <Field label="Телефон" htmlFor="qr-tel"><input id="qr-tel" value={d.tel} onChange={(e) => setD("tel", e.target.value)} placeholder="+7 900 000-00-00" inputMode="tel" className={inputCls} /></Field>}
              {s.kind === "email" && (
                <div className="grid gap-4">
                  <Field label="Кому" htmlFor="qr-mail"><input id="qr-mail" value={d.mailTo} onChange={(e) => setD("mailTo", e.target.value)} placeholder="hello@site.ru" inputMode="email" className={inputCls} /></Field>
                  <Field label="Тема" htmlFor="qr-subj"><input id="qr-subj" value={d.mailSubject} onChange={(e) => setD("mailSubject", e.target.value)} className={inputCls} /></Field>
                  <Field label="Текст письма" htmlFor="qr-body"><textarea id="qr-body" value={d.mailBody} onChange={(e) => setD("mailBody", e.target.value)} rows={3} className={inputCls + " h-auto py-2"} /></Field>
                </div>
              )}
              {s.kind === "wifi" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Название сети" htmlFor="qr-ssid"><input id="qr-ssid" value={d.wifiSsid} onChange={(e) => setD("wifiSsid", e.target.value)} className={inputCls} /></Field>
                  <Field label="Пароль" htmlFor="qr-pass"><input id="qr-pass" value={d.wifiPass} onChange={(e) => setD("wifiPass", e.target.value)} disabled={d.wifiType === "nopass"} className={inputCls} /></Field>
                  <Field label="Защита" htmlFor="qr-wtype">
                    <select id="qr-wtype" value={d.wifiType} onChange={(e) => setD("wifiType", e.target.value as QrData["wifiType"])} className={inputCls}>
                      <option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">Без пароля</option>
                    </select>
                  </Field>
                  <div className="self-end pb-1"><Toggle checked={d.wifiHidden} onChange={(v) => setD("wifiHidden", v)} label="Скрытая сеть" /></div>
                </div>
              )}
              {s.kind === "vcard" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Имя и фамилия" htmlFor="qr-name"><input id="qr-name" value={d.name} onChange={(e) => setD("name", e.target.value)} placeholder="Никита Алимпиев" className={inputCls} /></Field>
                  <Field label="Телефон" htmlFor="qr-vtel"><input id="qr-vtel" value={d.phone} onChange={(e) => setD("phone", e.target.value)} inputMode="tel" className={inputCls} /></Field>
                  <Field label="Email" htmlFor="qr-vmail"><input id="qr-vmail" value={d.email} onChange={(e) => setD("email", e.target.value)} inputMode="email" className={inputCls} /></Field>
                  <Field label="Сайт" htmlFor="qr-vsite"><input id="qr-vsite" value={d.site} onChange={(e) => setD("site", e.target.value)} inputMode="url" className={inputCls} /></Field>
                  <Field label="Компания" htmlFor="qr-org"><input id="qr-org" value={d.org} onChange={(e) => setD("org", e.target.value)} className={inputCls} /></Field>
                  <Field label="Должность" htmlFor="qr-title"><input id="qr-title" value={d.title} onChange={(e) => setD("title", e.target.value)} className={inputCls} /></Field>
                </div>
              )}
            </Card>
          ) : (
            <Card step={1} title="Список для кодов">
              <Field label="Одна строка — один QR-код" htmlFor="qr-batch" hint={<>Ссылки, артикулы, номера столов — что угодно. Адреса без https:// дополню сам. До {BATCH_MAX} строк, файлы в архиве назовутся по содержимому.</>}>
                <textarea id="qr-batch" value={batch} onChange={(e) => setBatch(e.target.value)} rows={8} spellCheck={false}
                  placeholder={"nikalimp.ru/\nnikalimp.ru/blog/\nСтол 12"} className={inputCls + " h-auto py-2 font-mono text-xs"} />
              </Field>
              {lines.length > BATCH_MAX && <p className="text-xs text-amber-600 dark:text-amber-400">Строк {lines.length} — возьму первые {BATCH_MAX}.</p>}
            </Card>
          )}

          <Card step={2} title="Картинка в центре">
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            {logo ? (
              <div className="flex items-center gap-3">
                <img src={logo} alt="" className={(s.shape === "circle" ? "rounded-full" : "rounded-md") + " size-12 border object-cover"} />
                <span className="min-w-0 flex-1 truncate text-sm">{logoName}</span>
                <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Заменить</button>
                <button type="button" onClick={() => { setLogo(null); setLogoName(""); }} aria-label="Убрать картинку" className="inline-flex size-9 items-center justify-center rounded-md border hover:bg-accent"><Trash2 className="size-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
                className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-accent">
                <ImagePlus className="size-6 text-brand" />Выберите или перетащите логотип, аватар или иконку
              </button>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">Файл никуда не загружается: картинка читается в браузере и встраивается прямо в QR-код.</p>
            {logo && (
              <>
                <Choice items={[{ id: "circle" as LogoShape, label: "В круге" }, { id: "square" as LogoShape, label: "В квадрате" }]} value={s.shape} onChange={(v) => set("shape", v)} label="Форма картинки" />
                <Field label={`Размер картинки — ${Math.round(s.scale * 100)} % стороны`} htmlFor="qr-scale" hint="С картинкой код собирается с максимальной коррекцией ошибок. Больше 25 % — проверьте, что код считывается.">
                  <input id="qr-scale" type="range" min={0.14} max={0.28} step={0.01} value={s.scale} onChange={(e) => set("scale", Number(e.target.value))} className="w-full accent-[var(--brand)]" />
                </Field>
              </>
            )}
          </Card>

          <Card step={3} title="Оформление">
            <Choice items={styles} value={s.style} onChange={(v) => set("style", v)} label="Форма точек" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Цвет кода" htmlFor="qr-fg"><div className="flex gap-2"><input id="qr-fg" type="color" value={s.fg} onChange={(e) => set("fg", e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border bg-background p-1" /><input aria-label="Цвет кода, HEX" value={s.fg} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && set("fg", e.target.value)} className={inputCls + " font-mono"} /></div></Field>
              <Field label="Цвет фона" htmlFor="qr-bg"><div className="flex gap-2"><input id="qr-bg" type="color" value={s.bg} onChange={(e) => set("bg", e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border bg-background p-1" /><input aria-label="Цвет фона, HEX" value={s.bg} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && set("bg", e.target.value)} className={inputCls + " font-mono"} /></div></Field>
              <Field label={`Поля — ${s.margin}`} htmlFor="qr-margin"><input id="qr-margin" type="range" min={0} max={8} value={s.margin} onChange={(e) => set("margin", Number(e.target.value))} className="mt-3 w-full accent-[var(--brand)]" /></Field>
            </div>
            {ratio < 4 && <p className="text-xs text-amber-600 dark:text-amber-400">Контраст {ratio.toFixed(1)}:1 — камера может не считать код. Сделайте код темнее фона.</p>}
            {ratio >= 4 && inverted && <p className="text-xs text-amber-600 dark:text-amber-400">Код светлее фона. Камера телефона такой прочитает, а старые сканеры и кассы — нет.</p>}
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          {mode === "single" ? (
            <div className="rounded-xl border bg-background p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">Готовый QR-код</h2>
                {sample && <span className="rounded-md bg-brand-bg px-2 py-0.5 text-xs text-brand">Пример</span>}
              </div>
              <div className="relative mt-3 overflow-hidden rounded-lg border">
                {svg
                  ? <div role="img" aria-label={sample ? "Пример QR-кода со ссылкой на nikalimp.ru" : "QR-код"} className={(sample ? "opacity-60 " : "") + "aspect-square w-full [&>svg]:size-full"} dangerouslySetInnerHTML={{ __html: svg }} />
                  : <div className="flex aspect-square w-full items-center justify-center bg-card p-6 text-center text-sm text-muted-foreground">Слишком много данных для одного QR-кода — сократите текст.</div>}
              </div>
              <div className="mt-3 space-y-1.5 text-xs leading-relaxed" aria-live="polite">
                {sample
                  ? <p className="text-muted-foreground">Это пример со ссылкой {SAMPLE}. Заполните данные слева — код пересоберётся.</p>
                  : svg && <p className={tone[scanText[scan].tone]}>{scanText[scan].text}</p>}
                {!sample && version >= DENSE_VERSION && <p className="text-amber-600 dark:text-amber-400">Плотный код: {matrix?.size}×{matrix?.size} точек. Печатайте от 3 см или сократите ссылку — например, уберите лишние параметры.</p>}
              </div>
              <Field label="Размер PNG и JPEG" htmlFor="qr-px">
                <select id="qr-px" value={s.px} onChange={(e) => set("px", Number(e.target.value))} className={inputCls + " mt-1"}>
                  {sizes.map((p) => <option key={p} value={p}>{p} × {p} px</option>)}
                </select>
              </Field>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {([["SVG", saveSvg], ["PNG", () => saveRaster("image/png")], ["JPEG", () => saveRaster("image/jpeg")]] as const).map(([l, fn]) => (
                  <button key={l} type="button" disabled={!svg || sample} onClick={fn}
                    className={(l === "SVG" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border bg-background hover:bg-accent") + " inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-medium disabled:opacity-50"}>
                    <Download className="size-4" />{l}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">SVG — для печати и макетов: не теряет качество при любом размере. PNG — для сайта и соцсетей, JPEG — когда нужен самый лёгкий файл.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-background p-5">
              <h2 className="font-semibold">Коды пачкой</h2>
              <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                {items.length ? `Готово ${goodItems.length} из ${items.length}` : "Вставьте строки слева — коды появятся здесь."}
              </p>
              {items.length > 0 && (
                <ul className="mt-4 grid max-h-[26rem] grid-cols-3 gap-2 overflow-auto">
                  {items.map((it) => (
                    <li key={it.name} title={it.value} className="min-w-0">
                      {it.svg
                        ? <div role="img" aria-label={`QR-код: ${it.value}`} className="aspect-square overflow-hidden rounded-md border [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: it.svg }} />
                        : <div className="flex aspect-square items-center justify-center rounded-md border bg-card p-1 text-center text-[10px] text-amber-600 dark:text-amber-400">Слишком длинно</div>}
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{it.value}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Field label="Формат" htmlFor="qr-bfmt">
                  <select id="qr-bfmt" value={batchFmt} onChange={(e) => setBatchFmt(e.target.value as "png" | "svg")} className={inputCls}>
                    <option value="png">PNG</option><option value="svg">SVG</option>
                  </select>
                </Field>
                <Field label="Размер PNG" htmlFor="qr-bpx">
                  <select id="qr-bpx" value={s.px} onChange={(e) => set("px", Number(e.target.value))} disabled={batchFmt === "svg"} className={inputCls}>
                    {sizes.map((p) => <option key={p} value={p}>{p} px</option>)}
                  </select>
                </Field>
              </div>
              <button type="button" disabled={!goodItems.length || zipping} onClick={saveZip}
                className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {zipping ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}Скачать все · ZIP
              </button>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Архив собирается в браузере. Перед печатью проверьте камерой пару кодов из пачки.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
