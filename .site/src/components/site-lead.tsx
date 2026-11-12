"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";

// Лид-магнит страницы примера: владельцу — бесплатный аудит и апгрейд сайта под ИИ; зрителю — такой же сайт под ключ.
export function SiteLead({ url, personal, price, upgrade, className = "" }: { name?: string; url: string; personal: boolean; price: string; upgrade: string; className?: string }) {
  const host = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  const [value, setValue] = useState(host);
  const service = personal ? "/services/personal-website/" : "/services/corporate-website/";
  return (
    <div className={`not-prose grid gap-4 md:grid-cols-2 ${className}`}>
      <aside aria-label="Бесплатно для владельца" className="rounded-2xl border border-brand/30 bg-brand-bg p-5 sm:p-6">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-background text-brand shadow-sm"><Wand2 className="size-5" /></span>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-brand">Это ваш сайт?</p>
        <p className="mt-1 text-lg font-semibold leading-snug">Проверьте, как {host} видят Яндекс и нейросети</p>
        <p className="mt-1.5 text-sm text-muted-foreground">Бесплатный SEO-аудит за минуту: заголовки, текст в HTML, разметка, доступ для ботов ChatGPT и Алисы. Красивый сайт часто почти пустой для поиска — апгрейд под ИИ стоит {upgrade.replace(/ /g, "\u00a0")}.</p>
        <form action="/seo-audit/" method="get" className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="tl-url">Адрес сайта</label>
          <input id="tl-url" name="url" value={value} onChange={(e) => setValue(e.target.value)} required inputMode="url" placeholder="example.ru" className="h-11 min-w-0 flex-1 rounded-lg border bg-background px-3 outline-none focus:ring-[3px] focus:ring-ring/50" />
          <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">Проверить<ArrowRight className="size-4" /></button>
        </form>
      </aside>
      <aside aria-label="Сайт под ключ" className="flex flex-col rounded-2xl border bg-card p-5 sm:p-6">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-bg text-brand"><Sparkles className="size-5" /></span>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Хотите так же?</p>
        <p className="mt-1 text-lg font-semibold leading-snug">{personal ? "Личный сайт" : "Сайт компании"} такого уровня — и с трафиком из поиска</p>
        <p className="mt-1.5 flex-1 text-sm text-muted-foreground">Дизайн не хуже, чем в этой коллекции, плюс то, чего обычно нет у конструкторов: страница на каждую услугу, разметка Schema.org и llms.txt, чтобы вас находили в Яндексе и рекомендовали нейросети. {price.replace(/ /g, "\u00a0")}, первый год администрирования включён.</p>
        <a href={service} className="mt-4 inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">Обсудить сайт<ArrowRight className="size-4" /></a>
      </aside>
    </div>
  );
}
