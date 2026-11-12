import type { Metadata } from "next";
import { getGalleryBase, getGalleryCategoryPages, getGallerySites } from "@/lib/sites";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { SiteCard, SiteTabs, grid } from "@/components/site-parts";
import { SitesSearch } from "@/components/sites-search";
import { faqSchema, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Примеры сайтов: коллекция красивых сайтов по нишам",
  description: "Коллекция красивых сайтов по категориям и нишам: бизнес, магазины, портфолио, мероприятия. Скриншот главной и разбор, как устроен каждый сайт.",
  alternates: { canonical: "/sites/" },
};

const faq = [
  { q: "Откуда эти сайты", a: "Из открытых галерей и подборок, куда дизайнеры отбирают лучшие работы за структуру, аккуратный интерфейс или необычную вёрстку. Источник указан на странице каждого сайта. Я собираю их в один каталог и раскладываю по нишам." },
  { q: "Что есть на странице примера", a: "Обложка и длинный скриншот главной, ссылка на сайт, из скольких блоков собрана страница и сколько из них свёрстано вручную, какие есть формы, квизы и корзина — и что взять для своего сайта в этой нише." },
  { q: "Как найти пример под свою нишу", a: "Выберите категорию галереи, а внутри — подкатегорию: рестораны, недвижимость, психологи, украшения и ещё два десятка ниш. Или введите в поиск название, нишу или домен." },
  { q: "Можно ли сделать такой же сайт, но лучше для поиска", a: "Да. Сайты на конструкторах часто красивые, но почти пустые для поисковиков и нейросетей. Я делаю личные и корпоративные сайты с таким же уровнем дизайна, но со страницей на каждую услугу, разметкой Schema.org и llms.txt." },
];

const SHOWN = 48;

export default function SitesPage() {
  const b = getGalleryBase();
  const items = getGallerySites();
  return (
    <>
      <JsonLd data={graph(
        { "@type": "CollectionPage", name: "Коллекция красивых сайтов", description: metadata.description, url: `${site.url}/sites/`, inLanguage: "ru-RU", ...(b.updated ? { dateModified: b.updated } : {}) },
        { "@type": "ItemList", name: "Примеры сайтов", numberOfItems: items.length, itemListElement: items.slice(0, 100).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.n, url: `${site.url}/sites/${it.s}/` })) },
        faqSchema(faq),
      )} />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Коллекция красивых сайтов</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {items.length} сайтов по категориям и нишам. Ищите референсы для своего проекта: на странице каждого примера — скриншот, как он устроен и что из него взять.
          </p>
          <SiteTabs categories={getGalleryCategoryPages()} total={items.length} />
          <SitesSearch niches={b.niches} shown={SHOWN} total={items.length}>
            <ul className={`mt-6 ${grid}`}>{items.slice(0, SHOWN).map((it, i) => <SiteCard key={it.s} it={it} niches={b.niches} eager={i < 4} />)}</ul>
          </SitesSearch>
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">Зачем этот каталог</h2>
            <div className="prose-site mt-4">
              <p>Я сделал больше 100 сайтов, и каждый проект начинается с поиска референсов. Галереи показывают лучшие работы, но в них несколько широких категорий: найти сайт кофейни или стоматологии среди тысяч бизнес-проектов трудно.</p>
              <p>Здесь те же сайты разложены по нишам, а у каждого есть своя страница. Каталогом удобно пользоваться, чтобы:</p>
              <ul>
                <li>собрать референсы для брифа дизайнеру;</li>
                <li>посмотреть, как конкуренты в нише оформляют первый экран и заявку;</li>
                <li>найти идеи для редизайна своего сайта.</li>
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
