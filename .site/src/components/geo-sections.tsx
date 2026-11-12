// Секции страницы GEO-продвижения и главной: схема работы нейросети, источники по нейросетям,
// состав работ, кому подходит, экспресс-проверка, сравнение «обычный сайт → AI-native сайт».
import Link from "next/link";
import {
  ArrowDown, ArrowRight, BadgeCheck, Building2, ChartLine, Check, FileCode2, GraduationCap, Layers, Megaphone,
  Rocket, ScanSearch, SearchCode, ShoppingBag, Stethoscope, Users, X, Zap,
} from "lucide-react";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { Button } from "@/components/ui/button";

// ——— Экспресс-проверка: полоса с одной кнопкой ———
export function ExpressBand({ className = "" }: { className?: string }) {
  return (
    <section className={`border-y border-brand/20 bg-brand-bg ${className}`}>
      <Container className="flex flex-col gap-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-2xl font-semibold tracking-tight">Начните с бесплатной экспресс-проверки</p>
          <p className="mt-2 text-muted-foreground">5 запросов в 4 нейросетях: называют ли вас и кого советуют вместо вас</p>
        </div>
        <Button asChild size="lg" className="shrink-0"><a href={site.telegram} target="_blank" rel="noopener"><Zap /> Проверить бесплатно</a></Button>
      </Container>
    </section>
  );
}

// ——— Как нейросеть выбирает, кого назвать ———
function Node({ title, text, tone = "plain" }: { title: string; text: string; tone?: "plain" | "dark" | "brand" }) {
  const cls =
    tone === "dark" ? "border-foreground bg-foreground text-background" : tone === "brand" ? "border-brand bg-brand-bg" : "bg-background";
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${cls}`}>
      <p className="font-semibold">{title}</p>
      <p className={`mt-1 text-xs leading-snug ${tone === "dark" ? "text-background/75" : "text-muted-foreground"}`}>{text}</p>
    </div>
  );
}

function Arrow() {
  return (
    <span className="flex items-center justify-center text-brand" aria-hidden="true">
      <ArrowDown className="size-5 lg:hidden" />
      <ArrowRight className="hidden size-5 lg:block" />
    </span>
  );
}

export function GeoHowAiChooses() {
  return (
    <Section className="border-t">
      <Container className="grid gap-10 lg:grid-cols-[2fr_3fr] lg:items-center">
        <div>
          <Eyebrow className="text-brand">Задача GEO</Eyebrow>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">Нейросеть выбирает, кого назвать в ответе</h2>
          <p className="mt-5 text-lg text-muted-foreground">Клиент спрашивает: «посоветуй», «кого выбрать», «что лучше». Нейросеть собирает факты о компаниях и называет тех, о ком знает и кому доверяет. Конкуренция идёт уже внутри готового ответа.</p>
        </div>
        <figure className="rounded-xl border bg-card p-5 sm:p-6">
          <div className="grid items-center gap-3 lg:grid-cols-[1fr_auto_1.3fr_auto_1.1fr_auto_1fr]">
            <Node tone="dark" title="Ваш бизнес" text="услуги, эксперт, продукт" />
            <Arrow />
            <div className="grid gap-3">
              <Node title="Сайт" text="услуги, цены, кейсы, разметка и llms.txt — что вы говорите о себе" />
              <Node title="Внешние источники" text="отзывы, каталоги, СМИ, рейтинги — что подтверждают другие" />
            </div>
            <Arrow />
            <Node title="Нейросети" text="Алиса AI, ChatGPT, GigaChat, DeepSeek" />
            <Arrow />
            <Node tone="brand" title="Вас называют" text="в ответе на вопрос клиента" />
          </div>
          <figcaption className="mt-5 border-t pt-4 text-sm text-muted-foreground">Сайт задаёт факты о бизнесе, внешние источники их подтверждают. Нейросеть сверяет оба сигнала и решает, включать ли вас в рекомендацию.</figcaption>
        </figure>
      </Container>
    </Section>
  );
}

// ——— Источники по нейросетям — из стартовых замеров (brandfound, AIMonitor, октябрь 2026) ———
const sources = [
  { ai: "ChatGPT", items: ["Справка OpenAI", "Google Search Central", "Блог Bing Webmaster", "Profi.ru", "VC.ru", "Workspace"] },
  { ai: "Алиса AI", items: ["Страницы услуг веб-студий", "Страницы GEO-агентств", "Блоги SEO-агентств"] },
];

export function GeoSourcesByAi() {
  return (
    <Section className="border-t bg-card">
      <Container className="grid gap-10 lg:grid-cols-[2fr_3fr]">
        <div>
          <Eyebrow className="text-brand">Источники</Eyebrow>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">У каждой нейросети свой набор источников</h2>
          <p className="mt-5 text-lg text-muted-foreground">В стартовых замерах по запросам о GEO-продвижении ChatGPT опирался на справки платформ и площадки-агрегаторы, а Алиса — на страницы услуг конкретных компаний.</p>
          <p className="mt-4 text-sm text-muted-foreground">Набор меняется от ниши, региона и формулировки. Поэтому площадки для вашего бизнеса подбираю после стартового замера, а не по универсальному списку. <Link href="/methodology/" className="text-brand hover:underline">Как я измеряю</Link></p>
        </div>
        <div className="divide-y border-y">
          {sources.map((s) => (
            <div key={s.ai} className="grid gap-3 py-5 sm:grid-cols-[9rem_1fr]">
              <p className="font-semibold">{s.ai}</p>
              <ul className="flex flex-wrap gap-2">
                {s.items.map((i) => <li key={i} className="rounded-md border bg-background px-2.5 py-1 text-sm">{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

// ——— Что входит в работу: сетка 2 × 3 с иконками ———
const workIcons = { ScanSearch, FileCode2, Layers, Megaphone, ChartLine, SearchCode } as const;
export type WorkIcon = keyof typeof workIcons;

export function GeoWorkGrid({ items, title }: { items: { title: string; text: string; icon?: string }[]; title: string }) {
  return (
    <Section className="border-t">
      <Container>
        <Eyebrow className="text-brand">Что входит в работу</Eyebrow>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">{title}</h2>
        <div className="mt-10 grid border-t sm:grid-cols-2">
          {items.map((it, i) => {
            const Icon = it.icon && it.icon in workIcons ? workIcons[it.icon as WorkIcon] : null;
            return (
              <div key={it.title} className={`border-b py-7 sm:px-0 ${i % 2 === 0 ? "sm:pr-8" : "sm:border-l sm:pl-8"}`}>
                <h3 className="flex items-center gap-3 text-lg font-semibold">
                  {Icon && <Icon className="size-5 shrink-0 text-brand" strokeWidth={1.75} />}
                  {it.title}
                </h3>
                <p className="mt-2 text-muted-foreground">{it.text}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

// ——— Кому подходит ———
const fit = [
  { icon: Stethoscope, title: "Экспертные услуги", text: "Клиники, юристы, консалтинг, школы — там, где выбирают того, кому доверяют." },
  { icon: Building2, title: "B2B и сложный продукт", text: "Поставщики и сервисы, которые долго сравнивают: читают обзоры и спрашивают нейросеть." },
  { icon: Users, title: "Малый бизнес услуг", text: "Ремонт, красота, туризм, доставка — конкуренция за первые строки ответа Алисы." },
  { icon: Rocket, title: "Стартапы и веб-сервисы", text: "Новый продукт, о котором нейросети ещё не знают и не могут его посоветовать." },
  { icon: GraduationCap, title: "Эксперты и авторы", text: "Личный бренд, курсы и Telegram-канал, которые должны всплывать на профильные вопросы." },
  { icon: ShoppingBag, title: "Нишевые магазины", text: "Интернет-магазины и бренды на маркетплейсах, которые сравнивают с конкурентами." },
];

export function GeoFit({ notFor }: { notFor?: string[] }) {
  return (
    <Section className="border-t bg-card">
      <Container className="grid gap-10 lg:grid-cols-[2fr_3fr]">
        <div>
          <Eyebrow className="text-brand">Кому подходит</Eyebrow>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">Там, где клиент сравнивает и долго выбирает</h2>
          {notFor && (
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium">Кому не подойдёт</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {notFor.map((f) => <li key={f} className="flex gap-2.5"><X className="mt-0.5 size-4 shrink-0" />{f}</li>)}
              </ul>
            </div>
          )}
        </div>
        <ul className="divide-y border-y">
          {fit.map((f) => (
            <li key={f.title} className="grid gap-2 py-5 sm:grid-cols-[2rem_11rem_1fr] sm:items-start sm:gap-4">
              <f.icon className="size-6 text-brand" strokeWidth={1.5} />
              <p className="font-semibold">{f.title}</p>
              <p className="text-muted-foreground">{f.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

// ——— Обычный сайт → AI-native сайт ———
export const compare: [string, string][] = [
  ["Текст подгружается скриптами — боты нейросетей видят пустую страницу", "Весь текст в HTML и открывается за секунду"],
  ["Общие слова: «индивидуальный подход», «команда профессионалов»", "Прямые ответы, цифры, таблицы и FAQ"],
  ["Услуги одной страницей, цены «по запросу»", "Страница на каждую услугу с ценой и сроком"],
  ["Нейросеть не понимает, кто вы и что продаёте", "Разметка Schema.org и llms.txt — факты о вас для машин"],
  ["Успех — позиции в Яндексе", "Успех — вас называют в ответах нейросетей и находят в поиске"],
];

export function SiteCompare() {
  return (
    <Section className="border-t">
      <Container>
        <Eyebrow className="text-brand">AI-native сайт</Eyebrow>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">Сайт для людей → сайт для людей и нейросетей</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Обычный сайт</p>
            <ul className="mt-4 space-y-3">
              {compare.map(([a]) => <li key={a} className="flex gap-3 text-muted-foreground"><X className="mt-0.5 size-4 shrink-0" />{a}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-brand/40 bg-brand-bg p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-brand">AI-native сайт</p>
            <ul className="mt-4 space-y-3">
              {compare.map(([, b]) => <li key={b} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{b}</li>)}
            </ul>
          </div>
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><BadgeCheck className="size-4 shrink-0 text-brand" /><span>nikalimp.ru собран по тем же правилам: <Link href="/llms.txt" className="text-brand hover:underline">llms.txt</Link>, разметка на каждой странице, текст без JavaScript.</span></p>
      </Container>
    </Section>
  );
}
