import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findGalleryCategory, getGalleryBase, getGalleryCategoryPages, getGallerySites, NICHE_FOR, NICHE_TIPS, plural, galleryCatPath, gallerySitesIn } from "@/lib/sites";
import { site } from "@/lib/site";
import { metaTitle } from "@/lib/utils";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { SiteCard, SiteTabs, grid } from "@/components/site-parts";
import { SitesSearch } from "@/components/sites-search";
import { breadcrumbs, graph } from "@/lib/schema";

// Общая страница категории (/sites/c/business/) и подкатегории (/sites/c/business/food/)
const SHOWN = 48;

function heading(slug: string) {
  const c = findGalleryCategory(slug);
  if (!c) return null;
  const parent = c.parent ? findGalleryCategory(c.parent) : undefined;
  const h1 = parent ? `Сайты ${NICHE_FOR[c.niche!] ?? c.name.toLowerCase()}: примеры дизайна` : `${c.name}: примеры сайтов`;
  return { c, parent, h1 };
}

export function categoryMeta(slug: string): Metadata {
  const h = heading(slug);
  if (!h) return {};
  const { c, parent } = h;
  const n = `${c.count} ${plural(c.count, "пример", "примера", "примеров")}`;
  return {
    title: metaTitle(parent ? `Сайты ${NICHE_FOR[c.niche!]}: ${n} дизайна` : `${c.name}: ${n} красивых сайтов по нишам`),
    description: (parent
      ? `${n} сайтов ${NICHE_FOR[c.niche!]} в коллекции NikAlimp (раздел «${parent.name}»). Обложки, скриншоты главных и разбор, как устроен каждый сайт.`
      : `${n} сайтов в категории «${c.name}» коллекции NikAlimp, по нишам. Обложки, скриншоты главных и разбор, как устроен каждый сайт.`).slice(0, 160),
    alternates: { canonical: galleryCatPath(c) },
  };
}

export function CategoryView({ slug }: { slug: string }) {
  const h = heading(slug);
  if (!h) notFound();
  const { c, parent, h1 } = h;
  const b = getGalleryBase();
  const items = gallerySitesIn(c.slug);
  const p = galleryCatPath(c);
  const tips = c.niche ? NICHE_TIPS[c.niche] : undefined;
  const kids = !parent ? getGalleryCategoryPages().filter((x) => x.parent === c.slug) : [];
  return (
    <>
      <JsonLd data={graph(
        { "@type": "ItemList", name: h1, url: `${site.url}${p}`, numberOfItems: items.length, itemListElement: items.slice(0, 100).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.n, url: `${site.url}/sites/${it.s}/` })) },
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "Примеры сайтов", path: "/sites/" }, ...(parent ? [{ name: parent.name, path: galleryCatPath(parent) }] : []), { name: c.name, path: p }]),
      )} />
      <Section className="pt-12">
        <Container>
          <nav aria-label="Хлебные крошки" className="mb-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/sites/" className="hover:text-foreground">Примеры сайтов</Link>
            {parent && <> / <Link href={galleryCatPath(parent)} className="hover:text-foreground">{parent.name}</Link></>}
          </nav>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">{h1}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {items.length} {plural(items.length, "сайт", "сайта", "сайтов")} в коллекции{parent ? ` в разделе «${parent.name}»` : ""}. На странице каждого — скриншот главной, из каких блоков она собрана и ссылка на сам сайт.
          </p>
          <SiteTabs categories={getGalleryCategoryPages()} total={getGallerySites().length} active={c.slug} />
          <SitesSearch niches={b.niches} scope={c.slug} shown={SHOWN} total={items.length}>
            <ul className={`mt-6 ${grid}`}>{items.slice(0, SHOWN).map((it, i) => <SiteCard key={it.s} it={it} niches={b.niches} eager={i < 4} />)}</ul>
          </SitesSearch>
          {tips && (
            <div className="mx-auto mt-16 max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight">Что важно на сайте {NICHE_FOR[c.niche!]}</h2>
              <ul className="prose-site mt-4">{tips.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">Как пользоваться подборкой</h2>
            <div className="prose-site mt-4">
              <p>Откройте 5–7 сайтов {parent ? `${NICHE_FOR[c.niche!]} ` : ""}подряд и выпишите, что повторяется: что стоит на первом экране, где кнопка заявки, как показаны цены и работы. Повторяющиеся решения — стандарт ниши, без них посетитель растеряется. Необычные решения — повод выделиться, если они не мешают сделать заявку.</p>
              <p>Для брифа дизайнеру достаточно трёх ссылок с пометкой, что нравится в каждой: цвет, шрифт, подача фото или структура. На странице примера есть длинный скриншот главной — по нему удобно разбирать структуру, не открывая сам сайт.</p>
              <p>Помните, что в коллекцию сайты попадают за дизайн, а не за продажи и позиции в поиске. Прежде чем копировать приём, проверьте, помогает ли он посетителю: быстро ли грузится страница на телефоне, видно ли цены и контакты, понятно ли с первого экрана, что предлагает компания. Красивый, но медленный сайт теряет и клиентов, и место в выдаче Яндекса.</p>
            </div>
          </div>
          {kids.length > 0 && (
            <div className="mx-auto mt-16 max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight">Ниши в разделе «{c.name}»</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {kids.map((k) => <li key={k.slug}><Link href={galleryCatPath(k)} className="flex justify-between rounded-lg border px-4 py-3 hover:bg-accent"><span>{k.name}</span><span className="font-mono text-sm text-muted-foreground">{k.count}</span></Link></li>)}
              </ul>
            </div>
          )}
        </Container>
      </Section>
      <Cta />
    </>
  );
}
