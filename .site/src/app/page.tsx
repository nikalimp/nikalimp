import { Fragment } from "react";
import { getCaseStudies } from "@/lib/case-studies";
import { CaseCard } from "@/components/case-card";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, X, BookOpen, Factory, Newspaper, Package, Send, Braces, Handshake, LayoutDashboard, QrCode, UserRound, Hourglass, MessageSquareText, Palette, PencilRuler, Sparkles, UserRoundSearch } from "lucide-react";
import { LogoMarquee } from "@/components/logo-marquee";
import { AchievementStories } from "@/components/achievement-stories";
import { achievements } from "@/lib/achievements";
import { site } from "@/lib/site";
import { story } from "@/lib/story";
import { Container, Eyebrow, Section } from "@/components/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { faqSchema, graph, orgId } from "@/lib/schema";
import { Cta } from "@/components/cta";
import { compare } from "@/components/geo-sections";
import { SystemSection } from "@/components/system-section";
import { StoryCarousel } from "@/components/story-carousel";
import { PartnerCalculator } from "@/components/partner-calculator";
import { offers, support } from "@/lib/offers";
import { deliverables, processAnswer, processFaq, processSteps } from "@/lib/process";

const featureIcons = { design: Palette, qr: QrCode, pack: Package, parser: Send, account: UserRound, admin: LayoutDashboard, factory: Factory, press: Newspaper };

// Второстепенные страницы — кнопки над сертификатами
const sitePages = [
  { href: "/cases/", label: "Кейсы" }, { href: "/blog/", label: "Блог" }, { href: "/services/", label: "Услуги" }, { href: "/products/", label: "Продукты" },
  { href: "/libraries/", label: "Библиотеки" }, { href: "/startups/", label: "База стартапов" }, { href: "/tools/", label: "Каталог инструментов" },
  { href: "/glossary/", label: "Глоссарий" }, { href: "/design-styles/", label: "Дизайн-направления" }, { href: "/fonts/", label: "Шрифты" }, { href: "/design-systems/", label: "Дизайн-системы" }, { href: "/ui-libraries/", label: "UI-библиотеки" },
  { href: "/geo-audit/", label: "GEO-аудит" }, { href: "/methodology/", label: "Методика замеров" }, { href: "/partners/", label: "Партнёрская программа" },
  { href: "/card/", label: "Визитка" }, { href: "/contacts/", label: "Контакты" },
];

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

export default function Home() {
  return (
    <>
      <JsonLd
        data={graph(
          faqSchema([...faq, ...processFaq]),
          {
            "@type": "HowTo",
            name: "Как проходит разработка сайта",
            description: processAnswer,
            url: `${site.url}/#process`,
            provider: { "@id": orgId },
            step: processSteps.map((st, i) => ({ "@type": "HowToStep", position: i + 1, name: st.title, text: `${st.what} Результат: ${st.result}`, url: `${site.url}/#step-${i + 1}` })),
          },
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
            С продвижением в ChatGPT, Perplexity, Claude, Алиса и GigaChat
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
            <Button asChild size="lg" className="h-auto min-h-11 shrink-0 whitespace-normal py-2.5"><a href={site.booking} target="_blank" rel="noopener">Записаться на консультацию <ArrowRight /></a></Button>
          </div>
        </Container>

        <LogoMarquee />
      </Section>

      {/* Сторителлинг */}
      <Section id="story" className="scroll-mt-14 overflow-hidden border-t bg-card">
        <Container>
          <Eyebrow>Моя история</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">Умение адаптироваться — главный навык</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Каждый год я меняю страну и совершенствую свои навыки: от преподавателя акробатики в Екатеринбурге до работы с лидерами мнений и стартапами в сфере MarTech.</p>
          <StoryCarousel steps={story} />
        </Container>
      </Section>

      {/* Дисклеймер */}
      <Section className="border-t">
        <Container>
          <Eyebrow>Дисклеймер</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">В 2026 я выбрал путь эссенциалиста и начал говорить «нет» мертворождённым проектам</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Каждый сайт должен зарабатывать деньги, поэтому я администрирую все проекты. Первый год входит в стоимость, дальше — {support.price}.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {supportCards.map((c) => (
              <div key={c.title} className="card rounded-xl border p-6">
                <span className="card-icon inline-flex size-10 items-center justify-center rounded-lg bg-brand-bg text-brand"><c.icon className="size-5" /></span>
                <p className="mt-4 font-semibold">{c.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Неочевидные бонусы */}
      <Section className="border-t bg-card">
        <Container>
          <Eyebrow>Неочевидные бонусы</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">Что вы получите, кроме сайта</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {bonuses.map((c) => (
              <div key={c.title} className="card rounded-xl border bg-background p-6">
                <span className="card-icon inline-flex size-10 items-center justify-center rounded-lg bg-brand-bg text-brand"><c.icon className="size-5" /></span>
                <p className="mt-4 font-semibold">{c.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Этапы — перенесено со страницы /process/ 29.10.2026 */}
      <Section id="process" className="scroll-mt-14 border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Этапы</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight">Как я делаю сайт: 9 этапов от брифа до запуска</h2>
          <p className="mt-4 text-muted-foreground">{processAnswer}</p>
          <p className="mt-2 text-sm text-muted-foreground">Сроки указаны для личного / корпоративного сайта.</p>
          <ol className="mt-10">
            {processSteps.map((st, i) => (
              <li key={st.title} id={`step-${i + 1}`} className="relative grid grid-cols-[2.5rem_1fr] gap-4 pb-10 last:pb-0 sm:gap-6">
                {i < processSteps.length - 1 && <span aria-hidden="true" className="absolute bottom-1 left-5 top-11 w-px -translate-x-1/2 bg-gradient-to-b from-brand/50 to-border" />}
                <span className="relative z-10 inline-flex size-10 items-center justify-center rounded-full border border-brand/40 bg-background font-mono text-sm text-brand">{String(i + 1).padStart(2, "0")}</span>
                <div className="pt-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg font-semibold">{st.title}</h3>
                    <span className="text-sm text-muted-foreground">{st.time}</span>
                  </div>
                  <p className="mt-2">{st.what}</p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border bg-background p-4">
                      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">От вас</dt>
                      <dd className="mt-1.5">{st.you}</dd>
                    </div>
                    <div className="rounded-lg border border-brand/30 bg-brand-bg p-4">
                      <dt className="font-mono text-[11px] uppercase tracking-wider text-brand">Результат</dt>
                      <dd className="mt-1.5">{st.result}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>

          <h3 className="mt-16 text-2xl font-semibold tracking-tight">Что вы получаете</h3>
          <ul className="mt-6 space-y-3">
            {deliverables.map((d) => <li key={d} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{d}</li>)}
          </ul>
        </Container>
      </Section>

      {/* Чуть подушним: причины сверху, сравнение «обычный → AI-native» снизу — одна секция */}
      <Section className="border-t">
        <Container>
          <Eyebrow>Теперь чуть подушним</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">Сайт для людей <span className="text-brand">→</span> сайт для людей и нейросетей</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Люди всё чаще не ищут сайты в Яндексе и Google, а спрашивают нейросеть и получают готовый ответ. Поэтому каждый мой сайт — AI-native: его понимают и люди, и ChatGPT с Алисой. SEO приводит из поиска, AEO — в быстрые ответы, GEO — в рекомендации нейросетей.</p>
          <ul className="mt-10 grid divide-y rounded-xl border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {([
              [MessageSquareText, "Ответ вместо ссылок", "Алиса AI, ChatGPT и Perplexity дают готовый ответ. До сайта доходят только те, кого назвали."],
              [Braces, "Побеждает понятный", "Нейросети цитируют источники с чёткой структурой, фактами и разметкой, а не самые красивые сайты."],
              [Hourglass, "Окно открыто", "Большинство компаний в рунете ещё не занимаются GEO. Кто начнёт сейчас, займёт место в ответах."],
            ] as const).map(([Icon, t, d]) => (
              <li key={t} className="p-5">
                <p className="flex items-center gap-2 font-medium"><Icon className="size-4 text-brand" />{t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 overflow-hidden rounded-xl border">
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
          <p className="mt-6 text-sm text-muted-foreground">nikalimp.ru собран по тем же правилам: <Link href="/llms.txt" className="text-brand hover:underline">llms.txt</Link>, разметка на каждой странице, текст без JavaScript.</p>
        </Container>
      </Section>
      <SystemSection />

      {/* Кейсы */}
      <Section id="cases" className="scroll-mt-14 border-t bg-card">
        <Container>
          <Eyebrow>Кейсы</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">Подробные разборы проектов</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Задача, решения, этапы и результат — на примерах сайтов и продуктов последних лет.</p>
          {caseStudies.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-3">{caseStudies.slice(0, 3).map((c) => <CaseCard key={c.slug} c={c} />)}</div>
          ) : null}
          <Button asChild variant="outline" className="mt-8"><Link href="/cases/">Все кейсы и проекты <ArrowRight /></Link></Button>
        </Container>
      </Section>

      {/* Партнёрка */}
      <Section className="hero border-t">
        <Container>
          <Eyebrow>Партнёрка</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">Буду рад вашим рекомендациям</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Отблагодарю кэшбэком с каждого оплаченного договора или окажу вам услуги стоимостью в 2 раза больше. Посмотрите, сколько принесёт рекомендация.</p>
          <div className="mt-8"><PartnerCalculator /></div>
          <Button asChild variant="outline" className="mt-8"><Link href="/partners/">Узнать подробнее <ArrowRight /></Link></Button>
        </Container>
      </Section>

      {/* Навигация по сайту и сертификаты */}
      <Section className="border-t">
        <Container>
          <Eyebrow>Ещё на сайте</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">Сертификаты, награды и полезные разделы</h2>
          <nav aria-label="Разделы сайта" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {sitePages.map((p) => (
                <li key={p.href}><Link href={p.href} className="inline-flex h-10 items-center gap-1.5 rounded-full border bg-background px-4 text-sm transition-colors hover:border-brand/40 hover:text-brand">{p.label}<ArrowRight className="size-3.5 opacity-50" /></Link></li>
              ))}
            </ul>
          </nav>
          <p className="mt-12 mb-5 text-sm text-muted-foreground">Сертификаты и награды — нажмите, чтобы посмотреть документы</p>
          <AchievementStories groups={achievements} />
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <Eyebrow>Вопросы</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight">Частые вопросы</h2>
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

      <Cta />
    </>
  );
}
