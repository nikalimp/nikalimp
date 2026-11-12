import type { Metadata } from "next";
import { getStartupBase, getStartupCategoryPages, getStartupsWithPages } from "@/lib/startups";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { CategoryTabs, StartupCard } from "@/components/startup-parts";
import { StartupSearch } from "@/components/startup-search";
import { faqSchema, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "База стартапов России: каталог продуктов по категориям",
  description: "Российские стартапы и продукты 2026 года по категориям: нейросети, продуктивность, маркетинг, Телеграм-боты. Что делает каждый сервис и для кого он.",
  alternates: { canonical: "/startups/" },
};

const faq = [
  { q: "Какие проекты есть в базе", a: "Российские продукты и стартапы, которые вышли в 2026 году: сервисы на нейросетях, инструменты для работы и маркетинга, Телеграм-боты, сервисы для сайтов, образования и здоровья." },
  { q: "Что есть на странице проекта", a: "Что делает продукт, для кого он, какую задачу решает, главные возможности, ссылка на сайт и похожие проекты из той же категории." },
  { q: "Как добавить свой проект", a: "Напишите мне в Telegram: название, сайт и пару фраз о продукте. Добавлю при следующем обновлении." },
  { q: "Как часто обновляется база", a: "Раз в месяц: добавляю новые проекты и обновляю описания." },
];

// На главной базы — самые популярные; остальные по кнопке, а все страницы проектов есть в категориях и карте сайта
const SHOWN = 60;

export default function StartupsPage() {
  const b = getStartupBase();
  const items = getStartupsWithPages();
  const cats = Object.fromEntries(b.categories.map((c) => [c.slug, c.name]));
  return (
    <>
      <JsonLd data={graph(
        { "@type": "CollectionPage", name: "База стартапов России", description: metadata.description, url: `${site.url}/startups/`, inLanguage: "ru-RU", ...(b.updated ? { dateModified: b.updated } : {}) },
        { "@type": "ItemList", name: "Стартапы России", numberOfItems: items.length, itemListElement: items.slice(0, 100).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.n, url: `${site.url}/startups/${it.s}/` })) },
        faqSchema(faq),
      )} />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">База стартапов России</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {items.length} российских продуктов и стартапов 2026 года. Выберите категорию или найдите проект по названию и задаче — на странице каждого рассказываю, что он делает и кому подойдёт.
          </p>
          <CategoryTabs categories={getStartupCategoryPages()} total={items.length} />
          <StartupSearch cats={cats} shown={SHOWN} total={items.length}>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.slice(0, SHOWN).map((it) => <StartupCard key={it.s} it={it} cats={cats} />)}</ul>
          </StartupSearch>
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">Зачем эта база</h2>
            <div className="prose-site mt-4">
              <p>Я делаю сайты и продвигаю проекты в поиске и нейросетях, поэтому часто ищу, кто уже работает в нише клиента. Российские продукты разбросаны по каналам, каталогам и чатам, а зарубежные базы их почти не видят. Здесь они собраны в одном месте.</p>
              <p>Базой удобно пользоваться, чтобы:</p>
              <ul>
                <li>найти российскую замену зарубежному сервису;</li>
                <li>изучить конкурентов перед запуском своего продукта;</li>
                <li>найти инструмент под конкретную задачу команды.</li>
              </ul>
            </div>
            <h2 className="mt-12 text-2xl font-semibold tracking-tight">Частые вопросы</h2>
            <div className="mt-4 divide-y rounded-xl border">
              {faq.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="cursor-pointer font-medium">{f.q}</summary>
                  <p className="mt-2 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
