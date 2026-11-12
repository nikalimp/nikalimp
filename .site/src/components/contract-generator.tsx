"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Copy, Download, FileDown, FileText, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { typograf } from "@/lib/typograf.mjs";
import { toHtml, toHtmlPage, toText, type Doc } from "@/lib/privacy-policy";
import { makeDocx, type DocxBlock } from "@/lib/docx";
import {
  PRESETS, VATS, buildAct, buildContract, defaultContract,
  type ContractConfig, type Party, type PartyType, type PayModel, type Preset,
} from "@/lib/contract";
import { Card, DocView, Field, Toggle, inputCls } from "@/components/privacy-generator";
import { site } from "@/lib/site";

const STORE = "contract-generator:v1";
const fix = (s: string) => typograf(s, { markdown: false });

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="grid gap-1 rounded-lg bg-muted p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} className={cn("h-8 rounded-md px-1 text-sm transition-colors", value === o.v ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Input({ id, value, onChange, placeholder, inputMode }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; inputMode?: "numeric" | "email" | "tel" }) {
  return <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} className={inputCls} />;
}

function PartyForm({ who, p, onChange, types }: { who: string; p: Party; onChange: (p: Party) => void; types: { v: PartyType; label: string }[] }) {
  const set = <K extends keyof Party>(k: K, v: Party[K]) => onChange({ ...p, [k]: v });
  const id = (k: string) => `cg-${who}-${k}`;
  return (
    <>
      <Segmented label={`Кто ${who}`} value={p.type} options={types} onChange={(v) => set("type", v)} />
      <Field label={p.type === "org" ? "Название организации" : "ФИО"} htmlFor={id("name")} hint="В именительном падеже — склонять не нужно.">
        <Input id={id("name")} value={p.name} onChange={(v) => set("name", v)} placeholder={p.type === "org" ? "ООО «Ромашка»" : "Иванов Иван Иванович"} />
      </Field>
      {p.type === "org" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Должность подписанта" htmlFor={id("pos")}><Input id={id("pos")} value={p.position} onChange={(v) => set("position", v)} /></Field>
          <Field label="ФИО подписанта" htmlFor={id("signer")}><Input id={id("signer")} value={p.signer} onChange={(v) => set("signer", v)} placeholder="Петров Пётр Петрович" /></Field>
          <div className="sm:col-span-2"><Field label="Основание полномочий" htmlFor={id("basis")}><Input id={id("basis")} value={p.basis} onChange={(v) => set("basis", v)} placeholder="Устав" /></Field></div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {p.type !== "person" && <Field label="ИНН" htmlFor={id("inn")}><Input id={id("inn")} value={p.inn} onChange={(v) => set("inn", v)} inputMode="numeric" /></Field>}
        {(p.type === "ip" || p.type === "org") && <Field label={p.type === "ip" ? "ОГРНИП" : "ОГРН"} htmlFor={id("ogrn")}><Input id={id("ogrn")} value={p.ogrn} onChange={(v) => set("ogrn", v)} inputMode="numeric" /></Field>}
        {p.type === "person" && <Field label="Паспорт" htmlFor={id("pass")}><Input id={id("pass")} value={p.passport} onChange={(v) => set("passport", v)} placeholder="серия, номер, кем и когда выдан" /></Field>}
        <Field label="Email" htmlFor={id("email")}><Input id={id("email")} value={p.email} onChange={(v) => set("email", v)} inputMode="email" /></Field>
        <Field label="Телефон" htmlFor={id("phone")}><Input id={id("phone")} value={p.phone} onChange={(v) => set("phone", v)} inputMode="tel" /></Field>
        <div className="sm:col-span-2"><Field label="Адрес" htmlFor={id("addr")}><Input id={id("addr")} value={p.address} onChange={(v) => set("address", v)} placeholder="г. Москва, ул. Тверская, д. 1" /></Field></div>
      </div>
      {p.type !== "person" && (
        <details className="group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm text-brand [&::-webkit-details-marker]:hidden">
            Банковские реквизиты <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Расчётный счёт" htmlFor={id("acc")}><Input id={id("acc")} value={p.account} onChange={(v) => set("account", v)} inputMode="numeric" /></Field>
            <Field label="БИК" htmlFor={id("bik")}><Input id={id("bik")} value={p.bik} onChange={(v) => set("bik", v)} inputMode="numeric" /></Field>
            <Field label="Банк" htmlFor={id("bank")}><Input id={id("bank")} value={p.bank} onChange={(v) => set("bank", v)} placeholder="АО «Т-Банк»" /></Field>
            <Field label="Корр. счёт" htmlFor={id("corr")}><Input id={id("corr")} value={p.corr} onChange={(v) => set("corr", v)} inputMode="numeric" /></Field>
          </div>
        </details>
      )}
    </>
  );
}

function ScopeField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onChange([...value, v.trim()]); setV(""); } };
  return (
    <fieldset className="space-y-1">
      <legend className="mb-1 text-sm font-medium">Что входит в услуги</legend>
      {value.map((s, i) => (
        <div key={`${s}-${i}`} className="flex items-start gap-2.5 rounded-md bg-brand-bg px-2 py-1.5 -mx-2 text-sm">
          <Check className="mt-0.5 size-4 shrink-0 text-brand" />
          <span className="flex-1 leading-snug">{s}</span>
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Убрать «${s}»`} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Добавить пункт" className={inputCls} />
        <Button type="button" variant="outline" size="icon" onClick={add} aria-label="Добавить пункт" className="shrink-0"><Plus /></Button>
      </div>
    </fieldset>
  );
}

type Tab = "contract" | "act";

// Документ → абзацы и таблицы для .docx
function toDocx(doc: Doc): DocxBlock[] {
  const out: DocxBlock[] = [{ text: fix(doc.title), heading: true, align: "center" }];
  for (const b of doc.blocks) {
    if (b.type === "h") out.push({ text: fix(b.text), heading: true });
    else if (b.type === "p") out.push({ text: fix(b.n ? `${b.n} ${b.text}` : b.text) });
    else if (b.type === "ul") b.items.forEach((i) => out.push({ text: `— ${fix(i)}` }));
    else out.push({ table: [b.head.map(fix), ...b.rows.map((r) => r.map(fix))], head: true });
  }
  return out;
}

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function ContractGenerator() {
  const [c, setC] = useState<ContractConfig>(() => defaultContract());
  const [tab, setTab] = useState<Tab>("contract");
  const [copied, setCopied] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Черновик хранится только в этом браузере
  useEffect(() => {
    let saved: Partial<ContractConfig> | null = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || "null"); } catch {}
    // ?ispolnitel=nikalimp — исполнитель заполняется реквизитами владельца сайта (для своих договоров)
    const mine = new URLSearchParams(window.location.search).get("ispolnitel") === "nikalimp";
    setC((prev) => {
      const next = { ...prev, ...(saved ?? {}), date: saved?.date || new Date().toISOString().slice(0, 10) };
      if (mine) next.exec = { ...next.exec, type: "self", name: site.legal.name, inn: site.legal.inn, email: site.email, phone: site.phone };
      if (mine) next.vat = "npd";
      return next;
    });
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORE, JSON.stringify(c)); } catch {}
  }, [c, ready]);

  const set = <K extends keyof ContractConfig>(k: K, v: ContractConfig[K]) => setC((p) => ({ ...p, [k]: v }));
  const applyPreset = (preset: Preset) => {
    const p = PRESETS[preset];
    setC((s) => ({ ...s, preset, serviceName: p.serviceName, scope: [...p.scope], result: p.result, payModel: p.payModel, ipTransfer: p.ipTransfer, thirdParty: p.thirdParty, term: p.term }));
  };

  const contract = useMemo(() => buildContract(c), [c]);
  const act = useMemo(() => buildAct(c), [c]);
  const doc = tab === "act" ? act : contract;
  const missing = [!c.exec.name.trim() && "исполнителя", !c.cust.name.trim() && "заказчика", !c.serviceName.trim() && "услуги", !c.price.trim() && "стоимость", !c.city.trim() && "город"].filter(Boolean) as string[];

  async function copy(kind: string, text: string, html?: string) {
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
    setCopied(kind);
    setTimeout(() => setCopied((k) => (k === kind ? null : k)), 1800);
  }

  const base = tab === "act" ? "akt" : "dogovor";

  function saveHtml() {
    saveBlob(new Blob([toHtmlPage(doc, fix)], { type: "text/html;charset=utf-8" }), `${base}.html`);
  }

  function saveDocx() {
    saveBlob(makeDocx(toDocx(doc)), `${base}.docx`);
  }

  // PDF — через окно печати: на печать уходит только документ
  function savePdf() {
    const cls = "print-doc-only";
    const title = document.title;
    let cleaned = false;
    const done = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove(cls);
      document.title = title;
      window.removeEventListener("afterprint", done);
    };
    document.body.classList.add(cls);
    document.title = base; // имя PDF-файла по умолчанию
    window.addEventListener("afterprint", done);
    window.print();
  }

  function reset() {
    if (!window.confirm("Очистить все поля и начать заново?")) return;
    setC({ ...defaultContract(), date: new Date().toISOString().slice(0, 10) });
    try { localStorage.removeItem(STORE); } catch {}
  }

  const payModels: { v: PayModel; label: string }[] = [
    { v: "fixed", label: "Фикс" },
    { v: "monthly", label: "Абонемент" },
    { v: "hourly", label: "Почасово" },
  ];
  const presets = Object.entries(PRESETS) as [Preset, (typeof PRESETS)[Preset]][];
  const npd = c.exec.type === "self";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Card step={1} title="Какие услуги">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Тип услуг">
            {presets.map(([v, p]) => (
              <button key={v} type="button" role="radio" aria-checked={c.preset === v} onClick={() => applyPreset(v)} className={cn("rounded-full border px-3 py-1 text-sm transition-colors", c.preset === v ? "border-brand bg-brand-bg text-brand" : "hover:bg-accent")}>
                {p.label}
              </button>
            ))}
          </div>
          <Field label="Название услуг" htmlFor="cg-service" hint="Как в предмете договора: «разработка сайта», «консультационные услуги».">
            <Input id="cg-service" value={c.serviceName} onChange={(v) => set("serviceName", v)} placeholder="разработка сайта" />
          </Field>
          <ScopeField value={c.scope} onChange={(v) => set("scope", v)} />
          <Field label="Результат" htmlFor="cg-result"><Input id="cg-result" value={c.result} onChange={(v) => set("result", v)} placeholder="опубликованный сайт и доступы к нему" /></Field>
        </Card>

        <Card step={2} title="Исполнитель">
          <PartyForm who="исполнитель" p={c.exec} onChange={(p) => setC((s) => ({ ...s, exec: p, vat: p.type === "self" ? "npd" : s.vat === "npd" ? "usn" : s.vat }))} types={[{ v: "ip", label: "ИП" }, { v: "org", label: "Организация" }, { v: "self", label: "Самозанятый" }]} />
        </Card>

        <Card step={3} title="Заказчик">
          <PartyForm who="заказчик" p={c.cust} onChange={(p) => set("cust", p)} types={[{ v: "org", label: "Организация" }, { v: "ip", label: "ИП" }, { v: "person", label: "Физлицо" }]} />
        </Card>

        <Card step={4} title="Сроки и оплата">
          <Segmented label="Модель оплаты" value={c.payModel} options={payModels} onChange={(v) => set("payModel", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={c.payModel === "monthly" ? "Стоимость в месяц, ₽" : c.payModel === "hourly" ? "Стоимость часа, ₽" : "Стоимость, ₽"} htmlFor="cg-price">
              <Input id="cg-price" value={c.price} onChange={(v) => set("price", v)} inputMode="numeric" placeholder="100000" />
            </Field>
            {c.payModel === "fixed" && <Field label="Предоплата, %" htmlFor="cg-prepay"><Input id="cg-prepay" value={c.prepay} onChange={(v) => set("prepay", v)} inputMode="numeric" /></Field>}
            {c.payModel === "monthly" && <Field label="Минимальный срок, мес." htmlFor="cg-min"><Input id="cg-min" value={c.minMonths} onChange={(v) => set("minMonths", v)} inputMode="numeric" /></Field>}
            <Field label="Срок оплаты, рабочих дней" htmlFor="cg-paydays"><Input id="cg-paydays" value={c.payDays} onChange={(v) => set("payDays", v)} inputMode="numeric" /></Field>
            <Field label="Приёмка акта, рабочих дней" htmlFor="cg-accept"><Input id="cg-accept" value={c.acceptDays} onChange={(v) => set("acceptDays", v)} inputMode="numeric" /></Field>
            {c.payModel === "fixed" && <Field label="Кругов правок" htmlFor="cg-rev"><Input id="cg-rev" value={c.revisions} onChange={(v) => set("revisions", v)} inputMode="numeric" /></Field>}
          </div>
          <Field label={c.payModel === "monthly" ? "Отчётный период" : "Срок оказания услуг"} htmlFor="cg-term"><Input id="cg-term" value={c.term} onChange={(v) => set("term", v)} /></Field>
          {!npd && (
            <Field label="НДС" htmlFor="cg-vat">
              <select id="cg-vat" value={c.vat} onChange={(e) => set("vat", e.target.value as ContractConfig["vat"])} className={inputCls}>
                {VATS.filter((v) => v.v !== "npd").map((v) => <option key={v.v} value={v.v}>{v.label}</option>)}
              </select>
            </Field>
          )}
        </Card>

        <Card step={5} title="Условия">
          <Toggle checked={c.thirdParty} onChange={(v) => set("thirdParty", v)} label="Не отвечаю за решения поисковиков и нейросетей" hint="Гарантируете объём и качество работ, а не позиции, упоминания и продажи, которые зависят от сторонних сервисов" />
          <Toggle checked={c.ipTransfer} onChange={(v) => set("ipTransfer", v)} label="Права на результат — заказчику" hint="Исключительные права переходят после акта и полной оплаты" />
          <Toggle checked={c.portfolio} onChange={(v) => set("portfolio", v)} label="Можно показывать в портфолио" />
          <Toggle checked={c.penalty} onChange={(v) => set("penalty", v)} label="Неустойка за просрочку" hint="0,1% в день, не больше 10% — для обеих сторон" />
          <Toggle checked={c.liabilityCap} onChange={(v) => set("liabilityCap", v)} label="Ограничить ответственность суммой оплаты" hint={c.cust.type === "person" ? "С физлицом-потребителем не применяется — закон о защите прав потребителей" : "Без упущенной выгоды"} />
          <Toggle checked={c.confidentiality} onChange={(v) => set("confidentiality", v)} label="Конфиденциальность" />
          <Toggle checked={c.edo} onChange={(v) => set("edo", v)} label="Переписка по email и в мессенджерах имеет силу" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Отказ от договора, дней" htmlFor="cg-notice"><Input id="cg-notice" value={c.noticeDays} onChange={(v) => set("noticeDays", v)} inputMode="numeric" /></Field>
            <Field label="Ответ на претензию, рабочих дней" htmlFor="cg-claim"><Input id="cg-claim" value={c.claimDays} onChange={(v) => set("claimDays", v)} inputMode="numeric" /></Field>
          </div>
        </Card>

        <Card step={6} title="Номер, город и дата">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Номер" htmlFor="cg-num"><Input id="cg-num" value={c.number} onChange={(v) => set("number", v)} /></Field>
            <Field label="Город" htmlFor="cg-city"><Input id="cg-city" value={c.city} onChange={(v) => set("city", v)} placeholder="Москва" /></Field>
            <Field label="Дата" htmlFor="cg-date"><input id="cg-date" type="date" value={c.date} onChange={(e) => set("date", e.target.value)} className={inputCls} /></Field>
          </div>
        </Card>

        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <RotateCcw className="size-3.5" /> Начать заново
        </button>
        <p className="text-xs text-muted-foreground">Черновик сохраняется в этом браузере — можно закрыть вкладку и вернуться.</p>
      </form>

      <div className="lg:sticky lg:top-20">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b p-2">
            <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist">
              {([["contract", "Договор"], ["act", "Акт"]] as [Tab, string][]).map(([v, l]) => (
                <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={cn("h-7 rounded-md px-3 text-sm transition-colors", tab === v ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}>{l}</button>
              ))}
            </div>
            <div className="ml-auto flex flex-wrap gap-1">
              <Button type="button" size="sm" onClick={() => copy("text", toText(doc, fix), toHtml(doc, fix))}>
                {copied === "text" ? <Check /> : <Copy />} {copied === "text" ? "Скопировано" : "Копировать"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={saveDocx}><FileDown /> Скачать DOCX</Button>
              <Button type="button" size="sm" variant="outline" onClick={savePdf} title="В окне печати выберите «Сохранить как PDF»"><FileText /> Скачать PDF</Button>
              <Button type="button" size="sm" variant="ghost" onClick={saveHtml} aria-label="Скачать HTML-файл"><Download /></Button>
            </div>
          </div>
          <p className="border-b px-4 py-2 text-xs text-muted-foreground">PDF: в окне печати выберите «Сохранить как PDF».</p>
          {missing.length > 0 && (
            <p className="border-b bg-brand-bg px-4 py-2 text-xs text-brand">Заполните {missing.join(", ")} — пока в тексте стоят метки в квадратных скобках.</p>
          )}
          <div className="max-h-[75dvh] overflow-y-auto p-5 sm:p-6 lg:max-h-[calc(100dvh-11rem)]">
            <DocView doc={doc} />
          </div>
        </div>
      </div>
      {/* Копия документа только для печати в PDF */}
      {ready && createPortal(<div className="print-doc"><DocView doc={doc} /></div>, document.body)}
    </div>
  );
}
