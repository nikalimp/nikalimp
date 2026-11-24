"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, Send } from "lucide-react";
import { site } from "@/lib/site";
import { leadOffers, type LeadOfferId } from "@/lib/lead-offers";

// Форма заявки (18.11.2026): POST в /api/lead.php → Telegram и почта Ника, копия заявки на сервере вне папки сайта.
// Без JavaScript форма уходит обычным POST, и PHP возвращает человека на ту же страницу с ?lead=sent.
// Цель Метрики lead с параметрами offer и page — по ним видно, какой оффер и раздел приносят заявки.

type Ym = (...a: unknown[]) => void;
const goal = (name: string, params?: Record<string, string>) => { try { (window as unknown as { ym?: Ym }).ym?.(site.metrikaId, "reachGoal", name, params); } catch {} };

export function LeadForm({ offer, siteUrl = "", defaultTask = "", compact = false, dark = false, center = false, className = "" }: { offer: LeadOfferId; siteUrl?: string; defaultTask?: string; compact?: boolean; dark?: boolean; center?: boolean; className?: string }) {
  const o = leadOffers[offer];
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const id = `lead-${o.id}`;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    data.page = window.location.pathname;
    setState("sending"); setError("");
    try {
      const r = await fetch("/api/lead.php", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
      const d = await r.json().catch(() => ({ error: "Сервер не ответил" }));
      if (!r.ok || !d.ok) throw new Error(d.error || "Не получилось отправить");
      setState("sent");
      goal("lead", { offer: o.id, page: data.page });
    } catch (err) { setError((err as Error).message); setState("error"); }
  };

  const field = `h-11 w-full min-w-0 rounded-lg border px-3 outline-none focus:ring-[3px] focus:ring-ring/50 ${dark ? "border-background/25 bg-background/10 placeholder:text-background/50" : "bg-background"}`;
  const muted = dark ? "text-background/75" : "text-muted-foreground";

  if (state === "sent") {
    return (
      <div className={`not-prose rounded-2xl border border-brand/40 bg-brand-bg p-6 text-foreground ${className}`} role="status">
        <p className="flex items-center gap-2 text-lg font-semibold"><Check className="size-5 text-brand" />Заявка отправлена</p>
        <p className="mt-2 text-muted-foreground">Я прочитаю её и отвечу в мессенджер или по телефону, который вы указали. Если срочно — напишите в <a href={site.telegram} target="_blank" rel="noopener" className="underline underline-offset-4">Telegram</a>.</p>
      </div>
    );
  }

  return (
    <div className={`not-prose ${className}`}>
      {!compact && (
        <div className={center ? "text-center" : ""}>
          <p className={`font-mono text-[11px] uppercase tracking-wider ${dark ? "text-background/70" : "text-brand"}`}>{o.eyebrow}</p>
          <h2 id={`${id}-title`} className="mt-2 text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl">{o.title}</h2>
          <p className={`mt-3 max-w-2xl ${center ? "mx-auto" : ""} ${muted}`}>{o.text}</p>
        </div>
      )}
      <form action="/api/lead.php" method="post" onSubmit={submit} aria-labelledby={compact ? undefined : `${id}-title`} aria-label={compact ? o.title : undefined} className={`grid gap-3 sm:grid-cols-2 ${compact ? "" : "mt-6"}`}>
        <input type="hidden" name="offer" value={o.id} />
        {/* Ловушка для ботов: поле скрыто от людей, PHP отбрасывает заявку, если оно заполнено */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden"><label>Не заполняйте<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Имя</span>
          <input name="name" required maxLength={80} autoComplete="name" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Telegram или телефон</span>
          <input name="contact" required maxLength={120} autoComplete="tel" placeholder="@username или +7…" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Сайт <span className={`font-normal ${muted}`}>(если есть)</span></span>
          <input name="site" defaultValue={siteUrl} maxLength={200} inputMode="url" placeholder="example.ru" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Задача <span className={`font-normal ${muted}`}>(коротко)</span></span>
          <input name="task" defaultValue={defaultTask} maxLength={500} placeholder={o.task} className={field} />
        </label>
        <label className={`flex items-start gap-2.5 text-sm sm:col-span-2 ${muted}`}>
          <input type="checkbox" name="consent" value="yes" required className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
          <span>Согласен на <a href="/consent/" className="underline underline-offset-4">обработку персональных данных</a> по <a href="/privacy-policy/" className="underline underline-offset-4">политике конфиденциальности</a></span>
        </label>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
          <button type="submit" disabled={state === "sending"} className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 font-medium hover:opacity-90 disabled:opacity-60 ${dark ? "bg-background text-foreground" : "bg-foreground text-background"}`}>
            {state === "sending" ? <><Loader2 className="size-4 animate-spin" />Отправляю…</> : <>{o.button}<ArrowRight className="size-4" /></>}
          </button>
          <a href={site.telegram} target="_blank" rel="noopener" className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-medium ${dark ? "border-background/30 hover:bg-background/10" : "bg-background hover:bg-accent"}`}><Send className="size-4" />Или написать в Telegram</a>
        </div>
        {state === "error" && <p role="alert" className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{error}. Напишите мне в <a href={site.telegram} target="_blank" rel="noopener" className="underline">Telegram</a> — заявка не потеряется.</p>}
      </form>
    </div>
  );
}
