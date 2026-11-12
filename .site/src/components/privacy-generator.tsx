"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Download, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { typograf } from "@/lib/typograf.mjs";
import {
  ACTIONS, BASES, DATA, DATA_PRIMARY, GOALS,
  buildConsent, buildPolicy, checkboxText, defaultConfig, defaultPurpose, linkify,
  toHtml, toHtmlPage, toText,
  type Block, type Doc, type OperatorType, type PolicyConfig, type Purpose,
} from "@/lib/privacy-policy";

const STORE = "privacy-generator:v1";
const fix = (s: string) => typograf(s, { markdown: false });

// ——— Поля формы (в стиле shadcn) ———

export const inputCls =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: React.ReactNode; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CheckRow({ checked, onChange, children, type = "checkbox", name }: { checked: boolean; onChange: () => void; children: React.ReactNode; type?: "checkbox" | "radio"; name?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 -mx-2 text-sm hover:bg-accent">
      <input type={type} name={name} checked={checked} onChange={onChange} className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
      <span className="leading-snug">{children}</span>
    </label>
  );
}

function AddCustom({ onAdd, placeholder = "Свой вариант" }: { onAdd: (v: string) => void; placeholder?: string }) {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onAdd(v.trim()); setV(""); } };
  return (
    <div className="flex gap-2 pt-1">
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} className={inputCls} />
      <Button type="button" variant="outline" size="icon" onClick={add} aria-label="Добавить свой вариант" className="shrink-0"><Plus /></Button>
    </div>
  );
}

function MultiField({ label, hint, options, value, onChange, primary }: { label: string; hint?: string; options: string[]; value: string[]; onChange: (v: string[]) => void; primary?: number }) {
  const [more, setMore] = useState(false);
  const custom = value.filter((v) => !options.includes(v));
  const hiddenChecked = primary ? options.slice(primary).some((o) => value.includes(o)) : false;
  const shown = primary && !more && !hiddenChecked ? options.slice(0, primary) : options;
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <fieldset className="space-y-1">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {hint && <p className="mb-1 text-xs text-muted-foreground">{hint}</p>}
      {shown.map((o) => <CheckRow key={o} checked={value.includes(o)} onChange={() => toggle(o)}>{o}</CheckRow>)}
      {primary && shown.length < options.length && (
        <button type="button" onClick={() => setMore(true)} className="inline-flex items-center gap-1 py-1 text-sm text-brand hover:underline">
          Ещё варианты <ChevronDown className="size-3.5" />
        </button>
      )}
      {custom.map((o) => (
        <div key={o} className="flex items-start gap-2.5 rounded-md bg-brand-bg px-2 py-1.5 -mx-2 text-sm">
          <Check className="mt-0.5 size-4 shrink-0 text-brand" />
          <span className="flex-1 leading-snug">{o}</span>
          <button type="button" onClick={() => onChange(value.filter((x) => x !== o))} aria-label={`Убрать «${o}»`} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
      ))}
      <AddCustom onAdd={(v) => !value.includes(v) && onChange([...value, v])} />
    </fieldset>
  );
}

function GoalField({ value, onChange, name }: { value: string; onChange: (v: string) => void; name: string }) {
  const isCustom = !GOALS.includes(value);
  return (
    <fieldset className="space-y-1">
      <legend className="mb-1 text-sm font-medium">Цель обработки</legend>
      {GOALS.map((g) => <CheckRow key={g} type="radio" name={name} checked={value === g} onChange={() => onChange(g)}>{g}</CheckRow>)}
      <CheckRow type="radio" name={name} checked={isCustom} onChange={() => !isCustom && onChange("")}>Свой вариант</CheckRow>
      {isCustom && <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} placeholder="Например: подбор персонала" className={inputCls} />}
    </fieldset>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className="relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full bg-muted-foreground/30 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-background after:shadow after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-4 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40" />
    </label>
  );
}

export function Card({ step, title, children, aside }: { step: number; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-bg font-mono text-xs text-brand">{step}</span>
        <h2 className="flex-1 font-semibold">{title}</h2>
        {aside}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ——— Превью документа ———

function Rich({ text }: { text: string }) {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = linkify(esc).replace(/\[([^\]]+)\]/g, '<mark class="rounded bg-brand-bg px-1 text-brand">$1</mark>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function DocView({ doc }: { doc: Doc }) {
  return (
    <article className="policy-doc">
      <h2 className="text-xl font-semibold leading-snug tracking-tight">{fix(doc.title)}</h2>
      {doc.blocks.map((b: Block, i) => {
        if (b.type === "h") return <h3 key={i}>{fix(b.text)}</h3>;
        if (b.type === "p") return <p key={i}>{b.n && <span className="text-muted-foreground">{b.n} </span>}<Rich text={fix(b.text)} /></p>;
        if (b.type === "ul") return <ul key={i}>{b.items.map((it, j) => <li key={j}><Rich text={fix(it)} /></li>)}</ul>;
        return (
          <div key={i} className="-mx-1 overflow-x-auto px-1">
            <table>
              <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><Rich text={fix(c)} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        );
      })}
    </article>
  );
}

// ——— Типовые сайты: что отметить заранее ———

type SiteKind = "landing" | "shop" | "school" | "service" | "blog";

const pick = <T,>(list: T[], idx: number[]) => idx.map((i) => list[i]);
const purpose = (goal: number, data: number[], bases: number[], actions: number[]): Purpose => ({
  goal: GOALS[goal], data: pick(DATA, data), bases: pick(BASES, bases), actions: pick(ACTIONS, actions),
});

const KINDS: Record<SiteKind, { label: string; hint: string; purposes: () => Purpose[]; analytics: string }> = {
  landing: {
    label: "Визитка / лендинг",
    hint: "Форма заявки и счётчик Метрики",
    purposes: () => [purpose(1, [0, 1, 2], [0], [0, 3])],
    analytics: "Яндекс Метрика",
  },
  shop: {
    label: "Интернет-магазин",
    hint: "Заказы, доставка, рассылка",
    purposes: () => [purpose(2, [0, 1, 2, 6], [0, 1], [0, 3, 4]), purpose(1, [0, 1, 2], [0], [0, 3]), purpose(4, [0, 1], [0], [0, 2])],
    analytics: "Яндекс Метрика",
  },
  school: {
    label: "Онлайн-школа",
    hint: "Договор, доступ к урокам, письма",
    purposes: () => [purpose(2, [0, 1, 2], [0, 1], [0, 3, 4]), purpose(3, [0, 1, 9], [0, 1], [0]), purpose(0, [0, 1], [0], [0, 2])],
    analytics: "Яндекс Метрика",
  },
  service: {
    label: "Сервис с регистрацией",
    hint: "Личный кабинет и оплата",
    purposes: () => [purpose(3, [0, 1, 9], [0, 1], [0, 1]), purpose(2, [0, 1, 4], [1], [0, 4]), purpose(0, [1], [0], [0, 2])],
    analytics: "Яндекс Метрика",
  },
  blog: {
    label: "Блог",
    hint: "Подписка и обратная связь",
    purposes: () => [purpose(0, [0, 1], [0], [0, 2]), purpose(1, [0, 1], [0], [0])],
    analytics: "Яндекс Метрика",
  },
};

// Сервисы аналитики и рекламы. foreign — данные уходят за границу
const SERVICES: { name: string; foreign?: string }[] = [
  { name: "Яндекс Метрика" },
  { name: "Пиксель VK Рекламы" },
  { name: "Top.Mail.ru" },
  { name: "Google Analytics", foreign: "США" },
];

const splitList = (s: string) => s.split(/\s*,\s*/).map((x) => x.trim()).filter(Boolean);

// ——— Шаги ———

const STEPS = ["Оператор", "Сайт и данные", "Cookie и сервисы", "Готово"] as const;
const STEP_KEY = "privacy-generator:step";
const KIND_KEY = "privacy-generator:kind";

function read(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, v: string | null) {
  try { if (v === null) localStorage.removeItem(key); else localStorage.setItem(key, v); } catch {}
}

function Stepper({ step, onStep, done }: { step: number; onStep: (i: number) => void; done: boolean[] }) {
  return (
    <nav aria-label="Шаги генератора">
      <ol className="grid grid-cols-4 gap-1.5">
        {STEPS.map((s, i) => {
          const current = i === step;
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => onStep(i)}
                aria-current={current ? "step" : undefined}
                className="group flex w-full flex-col gap-1.5 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span className={cn("h-1 w-full rounded-full transition-colors", i <= step ? "bg-brand" : "bg-muted-foreground/20")} />
                <span className={cn("flex items-start gap-1 text-xs leading-tight", current ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                  {done[i] && !current ? <Check className="mt-px size-3 shrink-0 text-brand" /> : <span className="font-mono">{i + 1}</span>}
                  <span className="min-w-0">{s}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ——— Генератор ———

type Tab = "policy" | "consent" | "checkbox";

export function PrivacyGenerator() {
  const [c, setC] = useState<PolicyConfig>(() => ({ ...defaultConfig(), date: "" }));
  const [tab, setTab] = useState<Tab>("policy");
  const [step, setStepState] = useState(0);
  const [kind, setKind] = useState<SiteKind | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Черновик хранится только в этом браузере. Без localStorage генератор тоже работает
  useEffect(() => {
    let saved: Partial<PolicyConfig> | null = null;
    try { saved = JSON.parse(read(STORE) || "null"); } catch {}
    setC((prev) => ({ ...prev, ...(saved ?? {}), date: saved?.date || new Date().toISOString().slice(0, 10) }));
    const s = Number(read(STEP_KEY));
    if (s >= 0 && s < STEPS.length) setStepState(s);
    const k = read(KIND_KEY);
    if (k && k in KINDS) setKind(k as SiteKind);
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) write(STORE, JSON.stringify(c));
  }, [c, ready]);

  const set = <K extends keyof PolicyConfig>(k: K, v: PolicyConfig[K]) => setC((p) => ({ ...p, [k]: v }));
  const setPurpose = (i: number, patch: Partial<Purpose>) => setC((p) => ({ ...p, purposes: p.purposes.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  function setStep(i: number) {
    setStepState(i);
    write(STEP_KEY, String(i));
    if (i === STEPS.length - 1) setTab("policy");
    // Возвращаем к началу шага, если форма ушла вверх за экран
    const top = formRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applyKind(k: SiteKind) {
    const p = KINDS[k];
    setKind(k);
    write(KIND_KEY, k);
    setC((s) => ({ ...s, purposes: p.purposes(), cookies: true, analytics: p.analytics }));
  }

  function toggleService(name: string, on: boolean) {
    const list = splitList(c.analytics);
    const next = on ? [...list, name] : list.filter((x) => x !== name);
    const foreign = SERVICES.find((s) => s.name === name)?.foreign;
    setC((s) => {
      const patch: Partial<PolicyConfig> = { analytics: next.join(", ") };
      if (on && foreign) {
        const countries = splitList(s.crossBorderCountries);
        patch.crossBorder = true;
        if (!countries.includes(foreign)) patch.crossBorderCountries = [...countries, foreign].join(", ");
      }
      return { ...s, ...patch };
    });
  }

  const policy = useMemo(() => buildPolicy(c), [c]);
  const consent = useMemo(() => buildConsent(c), [c]);
  const checkbox = checkboxText(c);
  const doc = tab === "consent" ? consent : policy;
  const missing = [!c.site.trim() && "адрес сайта", !c.operatorName.trim() && "оператора", !c.email.trim() && "email"].filter(Boolean) as string[];

  async function copy(k: string, text: string, html?: string) {
    try {
      if (html && "ClipboardItem" in window) {
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": new Blob([text], { type: "text/plain" }), "text/html": new Blob([html], { type: "text/html" }) })]);
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    setCopied(k);
    setTimeout(() => setCopied((x) => (x === k ? null : x)), 1800);
  }

  function download() {
    const blob = new Blob([toHtmlPage(doc, fix)], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = tab === "consent" ? "consent.html" : "privacy.html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function reset() {
    if (!window.confirm("Очистить все поля и начать заново?")) return;
    setC({ ...defaultConfig() });
    setKind(null);
    setTab("policy");
    write(STORE, null);
    write(KIND_KEY, null);
    setStep(0);
  }

  const opTypes: { v: OperatorType; label: string }[] = [
    { v: "ip", label: "ИП" },
    { v: "org", label: "Организация" },
    { v: "person", label: "Физлицо" },
  ];
  const sitePlain = c.site.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const services = splitList(c.analytics);
  const customServices = services.filter((s) => !SERVICES.some((x) => x.name === s));
  const usesMetrika = c.cookies && services.some((s) => /метрик/i.test(s));
  const last = step === STEPS.length - 1;
  const done = [
    !!c.operatorName.trim() && !!c.email.trim(),
    !!c.site.trim() && c.purposes.length > 0,
    step > 2,
    false,
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      {/* Форма по шагам */}
      <div ref={formRef} className="scroll-mt-20 space-y-4">
        <div className="rounded-xl border bg-background p-4">
          <Stepper step={step} onStep={setStep} done={done} />
          <p className="mt-3 text-xs text-muted-foreground">Черновик сохраняется в этом браузере — можно закрыть вкладку и вернуться.</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {step === 0 && (
            <>
              <Card step={1} title="Какой у вас сайт">
                <p className="-mt-2 text-sm text-muted-foreground">Отметим типовые данные, цели и сервисы. Всё можно поправить на следующих шагах.</p>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Тип сайта">
                  {(Object.entries(KINDS) as [SiteKind, (typeof KINDS)[SiteKind]][]).map(([k, p]) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={kind === k}
                      onClick={() => applyKind(k)}
                      className={cn("rounded-lg border px-3 py-2 text-left transition-colors", kind === k ? "border-brand bg-brand-bg" : "hover:bg-accent")}
                    >
                      <span className={cn("block text-sm font-medium", kind === k && "text-brand")}>{p.label}</span>
                      <span className="block text-xs text-muted-foreground">{p.hint}</span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card step={2} title="Оператор — владелец сайта">
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Кто оператор">
                  {opTypes.map((o) => (
                    <button key={o.v} type="button" role="radio" aria-checked={c.operatorType === o.v} onClick={() => set("operatorType", o.v)} className={cn("h-8 rounded-md text-sm transition-colors", c.operatorType === o.v ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <Field label={c.operatorType === "org" ? "Название организации" : "ФИО"} htmlFor="pg-name" hint="В именительном падеже — склонять не нужно.">
                  <input id="pg-name" value={c.operatorName} onChange={(e) => set("operatorName", e.target.value)} placeholder={c.operatorType === "org" ? "ООО «Ромашка»" : "Иванов Иван Иванович"} className={inputCls} />
                </Field>
                <Field label="Email для обращений по персональным данным" htmlFor="pg-email">
                  <input id="pg-email" type="email" value={c.email} onChange={(e) => set("email", e.target.value)} placeholder="privacy@example.ru" className={inputCls} />
                </Field>
                {c.operatorType !== "person" && (
                  <details className="group">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm text-brand [&::-webkit-details-marker]:hidden">
                      Реквизиты — необязательно <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <Field label="ИНН" htmlFor="pg-inn"><input id="pg-inn" value={c.inn} onChange={(e) => set("inn", e.target.value)} inputMode="numeric" className={inputCls} /></Field>
                      <Field label={c.operatorType === "ip" ? "ОГРНИП" : "ОГРН"} htmlFor="pg-ogrn"><input id="pg-ogrn" value={c.ogrn} onChange={(e) => set("ogrn", e.target.value)} inputMode="numeric" className={inputCls} /></Field>
                      <div className="sm:col-span-2"><Field label="Адрес" htmlFor="pg-addr"><input id="pg-addr" value={c.address} onChange={(e) => set("address", e.target.value)} placeholder="г. Москва, ул. Тверская, д. 1" className={inputCls} /></Field></div>
                    </div>
                  </details>
                )}
              </Card>
            </>
          )}

          {step === 1 && (
            <>
              <Card step={1} title="Сайт">
                <Field label="Адрес сайта, на котором собираются данные" htmlFor="pg-site">
                  <input id="pg-site" value={c.site} onChange={(e) => set("site", e.target.value)} placeholder="example.ru" inputMode="url" className={inputCls} />
                </Field>
                <Field label="Страница с политикой" htmlFor="pg-policy" hint="Если пусто — адрес сайта + /privacy">
                  <input id="pg-policy" value={c.policyUrl} onChange={(e) => set("policyUrl", e.target.value)} placeholder={sitePlain ? `${sitePlain}/privacy` : "example.ru/privacy"} inputMode="url" className={inputCls} />
                </Field>
                <Field label="Страница с согласием" htmlFor="pg-consent" hint="С 1 сентября 2025 года согласие оформляют отдельным документом. Если пусто — адрес сайта + /consent">
                  <input id="pg-consent" value={c.consentUrl} onChange={(e) => set("consentUrl", e.target.value)} placeholder={sitePlain ? `${sitePlain}/consent` : "example.ru/consent"} inputMode="url" className={inputCls} />
                </Field>
              </Card>

              {c.purposes.map((p, i) => (
                <Card
                  key={i}
                  step={2 + i}
                  title={c.purposes.length > 1 ? `Цель обработки № ${i + 1}` : "Цель обработки"}
                  aside={c.purposes.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setC((s) => ({ ...s, purposes: s.purposes.filter((_, j) => j !== i) }))} className="text-muted-foreground">
                      <Trash2 /> Удалить
                    </Button>
                  )}
                >
                  <GoalField name={`goal-${i}`} value={p.goal} onChange={(v) => setPurpose(i, { goal: v })} />
                  <MultiField label="Какие данные собираете" hint="Можно выбрать несколько" options={DATA} primary={DATA_PRIMARY} value={p.data} onChange={(v) => setPurpose(i, { data: v })} />
                  <MultiField label="Правовые основания" options={BASES} value={p.bases} onChange={(v) => setPurpose(i, { bases: v })} />
                  <MultiField label="Что делаете с данными" options={ACTIONS} value={p.actions} onChange={(v) => setPurpose(i, { actions: v })} />
                </Card>
              ))}
              <Button type="button" variant="outline" className="w-full" onClick={() => setC((s) => ({ ...s, purposes: [...s.purposes, defaultPurpose()] }))}>
                <Plus /> Добавить цель
              </Button>
            </>
          )}

          {step === 2 && (
            <Card step={1} title="Cookie и сервисы">
              <Toggle checked={c.cookies} onChange={(v) => set("cookies", v)} label="Cookie и веб-аналитика" hint="Включите, если на сайте стоит счётчик или пиксель" />
              {c.cookies && (
                <fieldset className="space-y-1">
                  <legend className="mb-1 text-sm font-medium">Сервисы аналитики и рекламы</legend>
                  {SERVICES.map((s) => (
                    <CheckRow key={s.name} checked={services.includes(s.name)} onChange={() => toggleService(s.name, !services.includes(s.name))}>
                      {s.name}{s.foreign && <span className="text-muted-foreground"> — данные уходят за границу</span>}
                    </CheckRow>
                  ))}
                  {customServices.map((s) => (
                    <div key={s} className="flex items-start gap-2.5 rounded-md bg-brand-bg px-2 py-1.5 -mx-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span className="flex-1 leading-snug">{s}</span>
                      <button type="button" onClick={() => toggleService(s, false)} aria-label={`Убрать «${s}»`} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                    </div>
                  ))}
                  <AddCustom onAdd={(v) => !services.includes(v) && toggleService(v, true)} placeholder="Другой сервис" />
                </fieldset>
              )}
              <Toggle checked={c.crossBorder} onChange={(v) => set("crossBorder", v)} label="Данные уходят за границу" hint="Например, Google Analytics, зарубежный хостинг или CRM. Перед этим нужно уведомить Роскомнадзор" />
              {c.crossBorder && (
                <Field label="Страны" htmlFor="pg-cb">
                  <input id="pg-cb" value={c.crossBorderCountries} onChange={(e) => set("crossBorderCountries", e.target.value)} placeholder="США, Нидерланды" className={inputCls} />
                </Field>
              )}
              <Field label="Срок обработки" htmlFor="pg-term">
                <input id="pg-term" value={c.consentTerm} onChange={(e) => set("consentTerm", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Дата редакции" htmlFor="pg-date">
                <input id="pg-date" type="date" value={c.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
              </Field>
            </Card>
          )}

          {last && (
            <>
              <div className="rounded-xl border bg-background p-5">
                <h2 className="font-semibold">{missing.length ? "Почти готово" : "Документы готовы"}</h2>
                {missing.length ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Не хватает: {missing.join(", ")}. Пока в тексте стоят метки в квадратных скобках.{" "}
                    <button type="button" onClick={() => setStep(missing.some((m) => m !== "адрес сайта") ? 0 : 1)} className="text-brand hover:underline">Заполнить</button>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Скопируйте политику, согласие и текст чекбокса — вкладки над документом.</p>
                )}
              </div>

              <div className="rounded-xl border bg-background p-5">
                <h2 className="font-semibold">Где разместить</h2>
                <ul className="mt-3 space-y-2.5 text-sm">
                  <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand" /><span>Политику — отдельной страницей{sitePlain ? ` ${sitePlain}/privacy` : ""}. Ссылку поставьте в подвал каждой страницы.</span></li>
                  <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand" /><span>Согласие — второй страницей, например /consent.</span></li>
                  <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand" /><span>Чекбокс согласия — рядом с кнопкой в каждой форме. Галочка не стоит заранее.</span></li>
                  {usesMetrika ? (
                    <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand" /><span>Баннер о cookie — на сайте стоит Метрика. В баннере дайте ссылку на политику.</span></li>
                  ) : c.cookies ? (
                    <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand" /><span>Баннер о cookie — если на сайте стоит счётчик или пиксель.</span></li>
                  ) : null}
                </ul>
              </div>

              <div className="rounded-xl border border-brand/30 bg-brand-bg p-5">
                <h2 className="font-semibold">Проверьте сайт целиком</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Политика готова — теперь проверьте сам сайт. Бесплатный аудит за минуту покажет ошибки в SEO, скорости, мобильной версии и видимости для нейросетей.
                </p>
                {sitePlain ? (
                  <Button asChild size="sm" className="mt-4">
                    <a href={`/seo-audit/?url=${encodeURIComponent(sitePlain)}`}>Проверить {sitePlain} <ArrowRight /></a>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline" className="mt-4">
                    <a href="/seo-audit/">Открыть аудит <ArrowRight /></a>
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Навигация по шагам */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft /> Назад
              </Button>
            )}
            {!last && (
              <Button type="button" className="ml-auto" onClick={() => setStep(step + 1)}>
                {step === STEPS.length - 2 ? "Готово" : "Далее"} <ArrowRight />
              </Button>
            )}
          </div>

          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <RotateCcw className="size-3.5" /> Начать заново
          </button>
        </form>
      </div>

      {/* Результат: на компьютере — рядом с формой, на телефоне — на последнем шаге */}
      <div className={cn("lg:sticky lg:top-20 lg:block", last ? "block" : "hidden")}>
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b p-2">
            <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist">
              {([["policy", "Политика"], ["consent", "Согласие"], ["checkbox", "Чекбокс"]] as [Tab, string][]).map(([v, l]) => (
                <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={cn("h-7 rounded-md px-3 text-sm transition-colors", tab === v ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}>{l}</button>
              ))}
            </div>
            {tab !== "checkbox" && (
              <div className="ml-auto flex flex-wrap gap-1">
                <Button type="button" size="sm" onClick={() => copy("text", toText(doc, fix), toHtml(doc, fix))}>
                  {copied === "text" ? <Check /> : <Copy />} {copied === "text" ? "Скопировано" : "Копировать"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => copy("html", toHtml(doc, fix))}>
                  {copied === "html" ? <Check /> : <Copy />} HTML
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={download} aria-label="Скачать HTML-файл"><Download /></Button>
              </div>
            )}
          </div>

          {missing.length > 0 && tab !== "checkbox" && (
            <p className="border-b bg-brand-bg px-4 py-2 text-xs text-brand">Заполните {missing.join(", ")} — пока в тексте стоят метки в квадратных скобках.</p>
          )}

          <div className="max-h-[75dvh] overflow-y-auto p-5 sm:p-6 lg:max-h-[calc(100dvh-11rem)]">
            {tab === "checkbox" ? (
              <div className="space-y-5 text-sm">
                <p className="text-muted-foreground">Поставьте этот чекбокс в каждую форму на сайте. Галочка не стоит заранее, а без неё форма не отправляется.</p>
                <label className="flex items-start gap-2.5 rounded-lg border bg-background p-4">
                  <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
                  <span dangerouslySetInnerHTML={{ __html: fix(checkbox.html).replace(/<a /g, '<a class="text-brand underline underline-offset-2" ') }} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => copy("cb-text", fix(checkbox.text))}>{copied === "cb-text" ? <Check /> : <Copy />} Текст</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => copy("cb-html", fix(checkbox.html))}>{copied === "cb-html" ? <Check /> : <Copy />} HTML со ссылками</Button>
                </div>
                <div className="rounded-lg bg-muted p-4 text-muted-foreground">
                  <p className="font-medium text-foreground">В Tilda</p>
                  <p className="mt-1">Добавьте в форму поле-чекбокс, вставьте в его подпись HTML со ссылками и сделайте поле обязательным.</p>
                </div>
              </div>
            ) : (
              <DocView doc={doc} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
