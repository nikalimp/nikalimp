import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TYPE_LABEL, faqFor, getSystem, getUiLibraries, getUiLibrary, librariesOf, mainType, servicesFor, type DsItem, type DsType } from "@/lib/design-systems";
import { serviceBySlug } from "@/lib/services";
import { site } from "@/lib/site";
import { metaDesc, metaTitle } from "@/lib/utils";
import { typograf } from "@/lib/typograf.mjs";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { DsCover } from "@/components/ds-cover";
import { DsCard, DsFacts, DsStatus } from "@/components/ds-parts";
import { JsonLd } from "@/components/json-ld";
import { LeadMagnet } from "@/components/lead-magnet";
import { ServiceCard } from "@/components/service-card";
import { breadcrumbs, faqSchema, graph, personId } from "@/lib/schema";

// Что даёт библиотека этого типа и как её применять — абзац на странице
const TYPE_TEXT: Record<DsType, string> = {
  blocks: "Блоки — это готовые секции страницы: первый экран, преимущества, тарифы, отзывы, вопросы, подвал. Страница собирается из них как из конструктора, а вы меняете тексты, картинки и цвета под бренд. Так лендинг делается за день, а не за неделю.",
  animations: "Анимации оживляют интерфейс: появление текста, бегущие строки, фоны, эффекты при наведении и прокрутке. Используйте их точечно — на первом экране и в ключевых акцентах. Тяжёлые эффекты замедляют сайт на телефонах, поэтому проверяйте скорость и уважайте настройку «меньше движения».",
  components: "Компоненты — детали интерфейса: кнопки, поля, меню, карточки, таблицы, диалоги. Библиотека дополняет базовый набор дизайн-системы вариантами, которых в ней нет, и экономит время на вёрстке и доступности.",
  templates: "Шаблоны — готовые сайты и дашборды целиком: страницы, навигация, адаптив и часто подключённая авторизация или оплата. Хороший старт, когда задача типовая: остаётся заменить контент и подогнать стиль.",
  charts: "Графики и виджеты для дашбордов: линии, столбцы, круговые диаграммы, карточки метрик. Подходят для аналитики, админок и личных кабинетов, где данные нужно показать наглядно.",
  icons: "Набор иконок в едином стиле: одна толщина линий, одна сетка, одни скругления. Иконки из одной библиотеки делают интерфейс цельным, а иконки из разных — лоскутным.",
  themes: "Темы и генераторы тем меняют внешний вид системы целиком: цвета, шрифты, радиусы, тени. Удобно, чтобы быстро подогнать готовые компоненты под фирменный стиль бренда.",
  figma: "Figma-кит повторяет компоненты системы в макетах: дизайнер собирает экраны из тех же деталей, что потом окажутся в коде. Это ускоряет передачу макета в разработку и убирает расхождения.",
  primitives: "Примитивы дают поведение без оформления: фокус, клавиатуру, роли для экранных читалок, позиционирование выпадающих меню. Внешний вид задаёте вы, поэтому на примитивах строят собственные дизайн-системы.",
  tool: "Инструмент помогает работать с системой: генерирует темы, ставит компоненты из командной строки или даёт визуальный редактор. Экономит время на рутине.",
  directory: "Каталог собирает ссылки на другие библиотеки и ресурсы экосистемы. Полезен, чтобы найти редкий компонент или проверить, что вышло нового.",
};

export function generateStaticParams() {
  const all = getUiLibraries();
  return all.length ? all.map((s) => ({ slug: s.slug })) : [{ slug: "none" }];
}

// Самый длинный вариант заголовка, который влезает в 65 знаков вместе с « — NikAlimp», иначе короче
const fit = (v: string[]) => v.find((x) => x.length + 11 <= 65) ?? v.find((x) => x.length <= 65) ?? v[v.length - 1];
const titleOf = (l: DsItem) => { const t = TYPE_LABEL[mainType(l)].toLowerCase(); return fit([`${l.name}: ${t} — обзор, цена и установка`, `${l.name}: ${t} — обзор и цена`, `${l.name}: обзор и цена`, l.name]); };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = getUiLibrary(slug);
  if (!l) return {};
  const desc = `${l.name} — ${l.short.replace(/\.$/, "").toLowerCase()}. ${l.about}`;
  return { title: metaTitle(titleOf(l)), description: metaDesc(desc), alternates: { canonical: `/ui-libraries/${l.slug}/` }, openGraph: { type: "article", title: titleOf(l), description: metaDesc(desc) } };
}

export default async function UiLibraryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getUiLibrary(slug);
  if (!l) notFound();
  const systems = l.systems.map(getSystem).filter((x): x is DsItem => !!x);
  const universal = l.systems.includes("any");
  const t = mainType(l);
  const pool = systems.length ? systems.flatMap((s) => librariesOf(s.slug)) : getUiLibraries().filter((x) => x.systems.includes("any"));
  const similar = [...new Map(pool.filter((x) => x.slug !== l.slug && x.types.includes(t)).map((x) => [x.slug, x])).values()].slice(0, 3);
  const services = servicesFor(l).map(serviceBySlug).filter((x): x is NonNullable<typeof x> => !!x);
  const faq = faqFor(l);
  const url = `/ui-libraries/${l.slug}/`;
  return (
    <>
      <JsonLd data={graph(
        { "@type": "Article", headline: titleOf(l), description: l.about, url: `${site.url}${url}`, inLanguage: "ru-RU", author: { "@id": personId }, dateModified: l.checked, about: { "@type": "SoftwareSourceCode", name: l.name, url: l.url, ...(l.github ? { codeRepository: `https://github.com/${l.github}` } : {}), ...(l.license ? { license: l.license } : {}), programmingLanguage: l.frameworks } },
        faqSchema(faq),
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "Библиотеки", path: "/libraries/" }, { name: "UI-библиотеки", path: "/ui-libraries/" }, { name: l.name, path: url }]),
      )} />
      <Section className="pt-12">
        <Container className="max-w-5xl">
          <nav aria-label="Хлебные крошки" className="mb-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/libraries/" className="hover:text-foreground">Библиотеки</Link> / <Link href="/ui-libraries/" className="hover:text-foreground">UI-библиотеки</Link>
          </nav>
          <p className="text-center font-mono text-[11px] uppercase tracking-wider text-brand">{l.types.map((x) => TYPE_LABEL[x]).join(" · ")}</p>
          <h1 className="mx-auto mt-2 max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">{l.name}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-muted-foreground">{l.short}</p>
          <DsCover item={l} className="mx-auto mt-8 max-w-3xl rounded-2xl border shadow-sm" />
          <DsStatus x={l} />

          {/* Связь с дизайн-системами — сразу под обложкой */}
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">{universal && !systems.length ? "Подходит к любой дизайн-системе" : "Дизайн-система:"}</span>
            {systems.map((s) => <Link key={s.slug} href={`/design-systems/${s.slug}/`} className="rounded-full border px-3 py-1 hover:border-brand/40 hover:text-brand">{s.name}</Link>)}
            {universal && systems.length > 0 && <span className="text-muted-foreground">и другие</span>}
          </div>

          <div className="prose-site mx-auto mt-10 max-w-3xl">
            <h2>Что такое {l.name}</h2>
            <p>{l.about}</p>
            {l.best_for && <p>{typograf(`Лучше всего подходит для задач: ${l.best_for}.`)}</p>}
            <h2>{TYPE_LABEL[t]}: как применять</h2>
            <p>{typograf(TYPE_TEXT[t])}</p>
            {systems.length > 0 && <p>{typograf(`${l.name} сделана для ${systems.map((s) => s.name).join(", ")}: токены цвета, радиусы и шрифты берутся из системы, поэтому блоки встают в проект без подгонки.`)} Перед установкой загляните на <Link href={`/design-systems/${systems[0].slug}/`}>страницу {systems[0].name}</Link> — там остальные библиотеки к этой системе.</p>}
            {l.tool && <p>Тарифы и аналоги — в <Link href={`/tools/${l.tool}/`}>каталоге инструментов</Link>.</p>}
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">{l.name} коротко</h2>
            <DsFacts x={l} systems={systems} />
          </div>

          <LeadMagnet kind="ui-library" name={l.name} className="mx-auto mt-14 max-w-3xl" />

          {services.length > 0 && (
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-semibold tracking-tight">Сайт или сервис под ключ</h2>
              <p className="mt-2 text-muted-foreground">{typograf("Подбираю дизайн-систему и библиотеки под задачу, собираю проект и готовлю его к поиску и ответам нейросетей.")}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">{services.map((x) => <ServiceCard key={x.slug} s={x} />)}</div>
            </div>
          )}

          <div className="mx-auto mt-14 max-w-3xl">
            <h2 className="text-xl font-semibold tracking-tight">Вопросы и ответы: {l.name}</h2>
            <div className="mt-4 divide-y rounded-xl border">
              {faq.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="cursor-pointer font-medium">{f.q}</summary>
                  <p className="mt-2 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {similar.length > 0 && (
            <div className="mt-16">
              <h2 className="text-center text-2xl font-semibold tracking-tight">Похожие библиотеки</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">{similar.map((x) => <DsCard key={x.slug} x={x} compact />)}</ul>
              <p className="mt-6 text-center text-sm"><Link href="/ui-libraries/" className="text-brand hover:underline">Все UI-библиотеки →</Link></p>
            </div>
          )}
        </Container>
      </Section>
      <Cta />
    </>
  );
}
