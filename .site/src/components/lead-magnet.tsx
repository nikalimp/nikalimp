"use client";

import { useState } from "react";
import { ArrowRight, Blocks, Bot, FileSearch, Layers, FileSignature, Gauge, Link2, Palette, Send, ShieldCheck, Sparkles, Type } from "lucide-react";

// Лид-магнит на второстепенных страницах библиотек: бесплатный следующий шаг по теме страницы.
// Аудиты принимают адрес прямо в карточке и открывают отчёт; остальные ведут в генератор или в Telegram.
export type MagnetKind = "geo-audit" | "seo-audit" | "site-audit" | "privacy" | "utm" | "contract" | "styles" | "style-concept" | "font-pair" | "founder" | "design-system" | "ui-library";

const TG = "https://t.me/nikalimp";
type Def = { icon: typeof Gauge; title: string; text: string; href: string; label: string; form?: "seo-audit" | "site-audit" | "geo-audit" };

function def(kind: MagnetKind, name?: string, host?: string): Def {
  switch (kind) {
    case "geo-audit": return { icon: Bot, title: "Видят ли ваш сайт ChatGPT и Алиса?", text: "GEO-проверка за минуту: пускает ли сайт ботов ChatGPT, Claude, Perplexity и Алисы, виден ли текст без JavaScript, удобно ли его цитировать. Бесплатно, с советами.", href: "/geo-audit/", label: "Проверить", form: "geo-audit" };
    case "seo-audit": return { icon: FileSearch, title: "Проверьте свой сайт бесплатно", text: "SEO-аудит за минуту: заголовки, тексты, индексация, разметка Schema.org и доступ для ботов нейросетей — с советами, что исправить.", href: "/seo-audit/", label: "Проверить", form: "seo-audit" };
    case "site-audit": return { icon: Gauge, title: "Бесплатный аудит вашего сайта", text: "Скорость и Core Web Vitals, HTTPS и редиректы, мобильная версия, robots.txt и карта сайта — отчёт с советами за минуту.", href: "/site-audit/", label: "Проверить", form: "site-audit" };
    case "privacy": return { icon: ShieldCheck, title: "Политика конфиденциальности за 5 минут", text: "Генератор соберёт политику и согласие по 152-ФЗ под ваш сайт — бесплатно, без регистрации.", href: "/privacy-generator/", label: "Открыть генератор" };
    case "utm": return { icon: Link2, title: "Ссылки с UTM-метками в один клик", text: "Генератор с пресетами Директа, VK Рекламы, Telegram и блогеров — чтобы в Метрике было видно, откуда клиенты.", href: "/utm-generator/", label: "Открыть генератор" };
    case "contract": return { icon: FileSignature, title: "Договор и акт за 10 минут", text: "Генератор договора оказания услуг для фрилансера, студии или агентства — бесплатно, с копированием в Word.", href: "/contract-generator/", label: "Открыть генератор" };
    case "styles": return { icon: Palette, title: "20 дизайн-направлений с живыми примерами", text: "Баухаус, глассморфизм, необрутализм и другие: где уместны, какие цвета и шрифты, и готовый промпт для нейросети.", href: "/design-styles/", label: "Смотреть стили" };
    case "style-concept": return { icon: Sparkles, title: `Хотите сайт в стиле «${name}»?`, text: "Пришлите ссылку на свой сайт или идею — бесплатно соберу 3 референса и набросок первого экрана в этом стиле.", href: TG, label: "Написать в Telegram" };
    case "font-pair": return { icon: Type, title: `Подберу пару к шрифту ${name}`, text: "Пришлите ссылку на сайт или макет — бесплатно предложу 2⁠–⁠3 сочетания для заголовков и текста с кириллицей.", href: TG, label: "Написать в Telegram" };
    case "design-system": return { icon: Layers, title: `Подберу библиотеки к ${name} под ваш проект`, text: "Расскажите, какой сайт или сервис нужен. Бесплатно соберу набор блоков, анимаций и шаблонов к этой системе и предложу структуру первого экрана.", href: TG, label: "Написать в Telegram" };
    case "ui-library": return { icon: Blocks, title: `Нужен сайт с ${name}?`, text: "Пришлите ссылку на свой сайт или опишите идею. Бесплатно подскажу, какие секции и анимации из библиотеки подойдут, и пришлю набросок первого экрана.", href: TG, label: "Написать в Telegram" };
    case "founder": return { icon: Sparkles, title: `Это ваш проект?`, text: `Проверьте, как ${host ?? "ваш сайт"} видят Яндекс, Google и нейросети: бесплатный SEO-аудит с советами. А если хотите обновить описание ${name ?? "проекта"} здесь — напишите мне.`, href: "/seo-audit/", label: "Проверить сайт", form: "seo-audit" };
  }
}

export function LeadMagnet({ kind, name, url, className = "" }: { kind: MagnetKind; name?: string; url?: string; className?: string }) {
  const host = url ? url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "") : undefined;
  const d = def(kind, name, host);
  const [value, setValue] = useState(kind === "founder" ? host ?? "" : "");
  const Icon = d.icon;
  const external = d.href.startsWith("http");
  return (
    <aside className={`not-prose relative overflow-hidden rounded-2xl border border-brand/30 bg-brand-bg p-5 sm:p-6 ${className}`} aria-label="Бесплатно">
      <div className="flex gap-4">
        <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-background text-brand shadow-sm sm:inline-flex"><Icon className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-wider text-brand">Бесплатно</p>
          <p className="mt-1 text-lg font-semibold leading-snug">{d.title}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{d.text}</p>
          {d.form ? (
            <form action={d.href} method="get" className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor={`lm-${kind}`}>Адрес сайта</label>
              <input id={`lm-${kind}`} name="url" value={value} onChange={(e) => setValue(e.target.value)} required inputMode="url" placeholder="example.ru" className="h-11 min-w-0 flex-1 rounded-lg border bg-background px-3 outline-none focus:ring-[3px] focus:ring-ring/50" />
              <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">{d.label}<ArrowRight className="size-4" /></button>
              {kind === "founder" && <a href={TG} target="_blank" rel="noopener" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-accent"><Send className="size-4" />Написать</a>}
            </form>
          ) : null}
          {d.form === "geo-audit" && <p className="mt-3 text-sm"><a href="/geo-audit/" className="underline underline-offset-4">Что входит в GEO-аудит сайта →</a></p>}
          {d.form ? null : (
            <a href={d.href} {...(external ? { target: "_blank", rel: "noopener" } : {})} className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">
              {external ? <Send className="size-4" /> : null}{d.label}{!external && <ArrowRight className="size-4" />}
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}
