import { Fragment } from "react";
import { getCaseStudies } from "@/lib/case-studies";
import { formatDate, getPosts } from "@/lib/posts";
import { CaseCard } from "@/components/case-card";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, X, BookOpen, Factory, Newspaper, Package, Send, Handshake, LayoutDashboard, QrCode, UserRound, Palette, PencilRuler, Sparkles, UserRoundSearch } from "lucide-react";
import { LogoMarquee } from "@/components/logo-marquee";
import { Container, Eyebrow, Section } from "@/components/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { faqSchema, graph } from "@/lib/schema";
import { Cta } from "@/components/cta";
import { compare } from "@/components/geo-sections";
import { offers, support } from "@/lib/offers";
import { processFaq } from "@/lib/process";

const featureIcons = { design: Palette, qr: QrCode, pack: Package, parser: Send, account: UserRound, admin: LayoutDashboard, factory: Factory, press: Newspaper };

const faq = [
  { q: "Сколько стоит личный сайт?", a: `${offers.personal.price}: эксклюзивный дизайн, упаковка продуктов и услуг, парсер заявок в Telegram и QR-визитка. Первый год администрирования входит в стоимость.` },
  { q: "Что входит в корпоративный сайт?", a: `${offers.corporate.price}: сайт с админ-панелью и личным кабинетом, контент-завод — блог, который пишется и публикуется по плану, — и публикации о компании во внешних ресурсах. Личный и корпоративный сайт вместе — ${offers.bundle.price}.` },
  { q: "Можно не показывать проект в портфолио?", a: "Можно. Я собираю портфолио и делюсь кейсами, чтобы продвигаться самому, поэтому режим инкогнито стоит ×2 к цене проекта." },
  { q: "Что будет после запуска?", a: `Я администрирую все проекты: ежемесячные отчёты, новые инструменты и 2 бесплатные итерации правок в год. Первый год входит в стоимость, дальше — ${support.price}.` },
  { q: "Что такое GEO-продвижение?", a: "GEO (Generative Engine Optimization) — оптимизация сайта, контента и внешних упоминаний, чтобы нейросети вроде ChatGPT, Алисы AI, GigaChat и Perplexity упоминали и рекомендовали вас в своих ответах." },
  { q: "Какие нейросети важны в России?", a: "В первую очередь Алиса AI и нейропоиск Яндекса — они опираются на индекс Яндекса. Дальше GigaChat и DeepSeek, а для B2B и IT-аудитории — ChatGPT, Perplexity, Gemini и Claude." },
  { q: "Сколько ждать результат в нейросетях?", a: "Первые сигналы обычно появляются через 1⁠–⁠3 месяца, устойчивое присутствие в ответах — через 3⁠–⁠6 месяцев. Результат измеряем каждый месяц по пулу запросов." },
];

const eyebrowTips = [
  { label: "SEO", href: "/glossary/seo/", tip: "Search Engine Optimization: позиции сайта в выдаче Яндекса и Google" },
  { label: "GEO", href: "/glossary/geo/", tip: "Generative Engine Optimization: упоминания и рекомендации в ответах нейросетей" },
  { label: "AEO", href: "/glossary/aeo/", tip: "Answer Engine Optimization: попадание в быстрые ответы поиска и голосовых помощников" },
  { label: "Web", tip: "Персональные и корпоративные сайты, которые понимают и люди, и нейросети" },
  { label: "Product", tip: "Личные кабинеты, админки и веб-сервисы" },
];


const supportCards = [
  { icon: BarChart3, title: "Ежемесячные отчёты", text: "Посещаемость, заявки, позиции в поиске и упоминания в нейросетях. Видно, сколько сайт приносит." },
  { icon: Sparkles, title: "Внедрение новых инструментов", text: "Появился полезный сервис или формат — подключаю его к вашему сайту, пока конкуренты присматриваются." },
  { icon: PencilRuler, title: "2 бесплатные итерации правок в год", text: "Обновить тексты, цены, фото или блоки — без отдельной сметы." },
];

const bonuses = [
  { icon: Handshake, title: "Нетворкинг", text: "Я знаю многих хороших людей и со всеми поддерживаю связь. Порекомендую подрядчиков, партнёров и клиентов — и отвечаю за каждую рекомендацию." },
  { icon: UserRoundSearch, title: "Знакомство с собой", text: "Всё начинается с распаковки. Я люблю психологию, поэтому вместе мы выявим сильные стороны вашей личности или бизнеса." },
  { icon: Palette, title: "Единый стиль", text: "Все проекты, созданные в партнёрстве, выполнены в одном стиле и с вниманием к деталям: сайт, визитка, соцсети." },
];

const caseStudies = getCaseStudies();
const posts = getPosts().slice(0, 3);

export default function Home() {
  return (
    <>
      <JsonLd
        data={graph(
          faqSchema([...faq, ...processFaq]),
        )}
      />

      {/* Hero */}
      <Section className="hero pt-16 sm:pt-24">
        <div className="hero-bg" aria-hidden="true"><div className="hero-glow" /></div>
        <Container className="flex flex-col items-center text-center">
          <Eyebrow className="eyebrow-cycle hero-in">
            {eyebrowTips.map((t, i) => (
              <Fragment key={t.label}>
                {i > 0 && " · "}
                <span className="tip">
                  <span tabIndex={0} className="tip-trigger" aria-describedby={`tip-${i}`}>{t.label}</span>
                  <span role="tooltip" id={`tip-${i}`} className="tip-body">
                    {t.tip}
                    {t.href && <Link href={t.href} className="tip-more">Подробнее →</Link>}
                  </span>
                </span>
              </Fragment>
            ))}
          </Eyebrow>
          <h1 className="max-w-3xl text-[2.1rem] font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl">
            {["Создание", "персональных", "и корпоративных", "сайтов"].map((w, i) => <Fragment key={i}>{i > 0 && " "}<span className="hero-word" style={{ animationDelay: `${120 + i * 70}ms` }}>{w}</span></Fragment>)}
          </h1>
          <p style={{ animationDelay: "420ms" }} className="hero-in mt-5 max-w-2xl text-lg text-muted-foreground">
            С продвижением в ChatGPT, Perplexity, Claude, Алиса и GigaChat
          </p>
        </Container>

        <Container className="hero-in mt-10" style={{ animationDelay: "500ms" }}>
          <ul className="grid gap-4 text-left md:grid-cols-2">
            {[offers.personal, offers.corporate].map((o) => (
              <li key={o.title} className="card group relative flex h-full flex-col rounded-xl border bg-background p-6">
                {/* Ссылка растянута на всю карточку, теги с подсказками лежат поверх неё */}
                <p className="text-lg font-semibold"><Link href={o.href} className="after:absolute after:inset-0 after:rounded-xl">{o.title}</Link> <span className="text-muted-foreground">{o.audience}</span></p>
                <ul className="offer-tips relative z-10 mt-4 flex flex-1 flex-wrap content-start gap-2" aria-label="Что внутри">
                  {o.features.map((f, i) => {
                    const Icon = featureIcons[f.icon];
                    const id = `offer-${f.icon}-${i}`;
                    return (
                      <li key={f.label} className="tip">
                        <span tabIndex={0} aria-describedby={id} className="inline-flex cursor-help items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon className="size-4 text-brand" />{f.label}</span>
                        <span role="tooltip" id={id} className="tip-body">{f.tip}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-5 flex items-center justify-between border-t pt-4 text-2xl font-semibold tracking-tight tabular-nums">{o.price}<ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></p>
              </li>
            ))}
          </ul>
          <div className="border-beam mt-4 flex flex-col gap-4 rounded-xl border border-brand/40 bg-brand-bg p-5 text-left sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <p className="font-semibold">{offers.bundle.title}</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold tracking-tight tabular-nums">
                {offers.bundle.price}
                <s className="font-normal text-muted-foreground decoration-2">{offers.bundle.oldPrice}</s>
              </p>
            </div>
            <Button asChild size="lg" className="h-auto min-h-11 shrink-0 whitespace-normal py-2.5"><a href="#lead">Обсудить проект <ArrowRight /></a></Button>
          </div>
        </Container>

        <LogoMarquee />
      </Section>

      {/* Кейсы: все карточки в слайдере с боковой прокруткой, по 2 на экране (18.11.2026) */}
      <Section id="cases" className="scroll-mt-14 border-t bg-card">
        <Container>
          <Eyebrow className="text-center">Кейсы</Eyebrow>
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-semibold tracking-tight">Подробные разборы проектов</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">Задача, решения, этапы и результат — на примерах сайтов и продуктов последних лет.</p>
          <ul className="case-slider -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6" aria-label="Кейсы">
            {caseStudies.map((c) => <li key={c.slug} className="grid w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)]"><CaseCard c={c} /></li>)}
          </ul>
        </Container>
      </Section>

      {/* Чуть подушним: причины сверху, сравнение «обычный → AI-native» снизу — одна секция */}
      <Section className="border-t">
        <Container>
          <Eyebrow className="text-center">Теперь чуть подушним</Eyebrow>
          <h2 className="mx-auto text-center text-2xl font-semibold leading-tight tracking-tight sm:whitespace-nowrap sm:text-4xl">Сайт для людей <span className="text-brand">→</span> сайт для нейросетей</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">Люди всё чаще не ищут сайты в Яндексе и Google, а спрашивают нейросеть и получают готовый ответ. Поэтому каждый мой сайт — AI-native: его понимают и люди, и ChatGPT с Алисой. SEO приводит из поиска, AEO — в быстрые ответы, GEO — в рекомендации нейросетей.</p>
          <div className="mt-10 overflow-hidden rounded-xl border">
            <div className="grid grid-cols-2 border-b font-mono text-xs uppercase tracking-wider">
              <p className="bg-card p-4 text-muted-foreground">Обычный сайт</p>
              <p className="border-l border-brand/30 bg-brand-bg p-4 text-brand">AI-native сайт</p>
            </div>
            <ul className="divide-y">
              {compare.map(([was, now]) => (
                <li key={now} className="grid grid-cols-2 text-sm">
                  <p className="flex gap-2.5 p-4 text-muted-foreground"><X className="mt-0.5 size-4 shrink-0" />{was}</p>
                  <p className="flex gap-2.5 border-l border-brand/30 bg-brand-bg/50 p-4"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{now}</p>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">nikalimp.ru собран по тем же правилам: <Link href="/llms.txt" className="text-brand hover:underline">llms.txt</Link>, разметка на каждой странице, текст без JavaScript.</p>
        </Container>
      </Section>

      {/* Администрирование и бонусы — один блок (18.11.2026: раньше «Дисклеймер» и «Неочевидные бонусы») */}
      <Section className="border-t">
        <Container>
          <Eyebrow className="text-center">Что вы получаете, кроме сайта</Eyebrow>
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-semibold tracking-tight">Сайт с администрированием: каждый месяц видно, что он приносит</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">Я администрирую все проекты, потому что сайт должен зарабатывать, а не просто существовать. Первый год входит в стоимость, дальше — {support.price}.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[...supportCards, ...bonuses].map((c) => (
              <div key={c.title} className="card rounded-xl border p-6">
                <span className="card-icon inline-flex size-10 items-center justify-center rounded-lg bg-brand-bg text-brand"><c.icon className="size-5" /></span>
                <p className="mt-4 font-semibold">{c.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Cta offer="site" center />

      {/* FAQ */}
      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <Eyebrow className="text-center">Вопросы</Eyebrow>
          <h2 className="text-center text-3xl font-semibold tracking-tight">Частые вопросы</h2>
          <div className="mt-8 divide-y border-y">
            {[...faq, ...processFaq].map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="flex items-center justify-between gap-4">{f.q}<span className="text-muted-foreground transition-transform group-open:rotate-45">+</span></span>
                </summary>
                <p className="mt-3 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      {/* Последние статьи блога (18.11.2026) */}
      <Section className="border-t">
        <Container>
          <Eyebrow className="text-center">Блог</Eyebrow>
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-semibold tracking-tight">Последние статьи</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}/`} className="card group flex flex-col overflow-hidden rounded-xl border hover:bg-accent">
                {p.cover && <img src={p.cover} alt="" loading="lazy" width={1200} height={630} className="aspect-[40/21] w-full border-b object-cover" />}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-sm text-muted-foreground">{formatDate(p.date)}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:text-brand">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center"><Button asChild variant="outline"><Link href="/blog/">Все статьи <ArrowRight /></Link></Button></div>
        </Container>
      </Section>
    </>
  );
}
