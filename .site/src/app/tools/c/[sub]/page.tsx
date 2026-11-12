import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubcategories } from "@/lib/tools";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { RussiaBadge, ToolMark, shortPrice } from "@/components/tool-parts";
import { breadcrumbs, graph } from "@/lib/schema";
import { metaTitle } from "@/lib/utils";

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

// Хаб подкатегории каталога: «Конструкторы сайтов», «SEO-платформы»… — под запросы «лучшие X»
export function generateStaticParams() {
  return getSubcategories().map((g) => ({ sub: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ sub: string }> }): Promise<Metadata> {
  const { sub } = await params;
  const g = getSubcategories().find((x) => x.slug === sub);
  if (!g) return {};
  // title 40–65 символов вместе с « — NikAlimp»: короткое имя раздела дополняем, длинное сокращаем
  const svc = `${g.tools.length} ${plural(g.tools.length, "сервис", "сервиса", "сервисов")}`;
  const fits = (t: string) => (t + " — NikAlimp").length >= 40 && (t + " — NikAlimp").length <= 65;
  const variants = [`${g.name}: ${svc} и аналоги`, `${g.name}: ${svc}, цены и аналоги`, `${g.name}: сравнение ${svc}, цены и аналоги`, `${g.name}: ${svc}`];
  const title = metaTitle(variants.find(fits) ?? variants[0]);
  const description = `${g.name}: сравнение ${g.tools.length} сервисов — что умеют, сколько стоят, работают ли из России и чем заменить. Каталог инструментов NikAlimp.`.slice(0, 160);
  return { title, description, alternates: { canonical: `/tools/c/${g.slug}/` } };
}

export default async function SubcategoryPage({ params }: { params: Promise<{ sub: string }> }) {
  const { sub } = await params;
  const g = getSubcategories().find((x) => x.slug === sub);
  if (!g) notFound();
  const p = `/tools/c/${g.slug}/`;
  const tools = [...g.tools].sort((a, b) => Number(b.rich) - Number(a.rich) || a.name.localeCompare(b.name, "ru"));
  const works = g.tools.filter((t) => t.card.russia === "ok" || t.market.includes("Россия")).length;
  return (
    <>
      <JsonLd data={graph(
        { "@type": "ItemList", name: g.name, url: `${site.url}${p}`, itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: `${site.url}/tools/${t.slug}/` })) },
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "Инструменты", path: "/tools/" }, { name: g.name, path: p }]),
      )} />
      <Section className="pt-12">
        <Container className="max-w-4xl">
          <nav className="mb-6 text-center text-sm text-muted-foreground"><Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/tools/" className="hover:text-foreground">Инструменты</Link></nav>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{g.name}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">
            {g.tools.length} сервисов в разделе «{g.category}»: что умеет каждый, сколько стоит и работает ли из России. {works > 0 && `Российских или доступных без ограничений — ${works}.`} Нажмите на сервис — там описание, тарифы, плюсы и минусы и аналоги.
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {tools.map((t) => (
              <li key={t.slug}>
                <Link href={`/tools/${t.slug}/`} className="card flex h-full gap-3 rounded-xl border p-4 hover:bg-accent">
                  <ToolMark t={t} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-medium">{t.name}<RussiaBadge status={t.card.russia} /></span>
                    <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{t.short}</span>
                    {shortPrice(t) && <span className="mt-1.5 block text-xs text-muted-foreground">{shortPrice(t)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-12 max-w-2xl text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Как выбрать сервис</h2>
            <p className="mt-3">Сначала проверьте, работает ли сервис из России: зелёный значок — без ограничений, жёлтый — нужен VPN или зарубежная карта. Потом сравните цену первого платного тарифа и есть ли бесплатный план, чтобы попробовать сервис на своей задаче. На странице каждого инструмента есть описание, плюсы и минусы, тарифы и аналоги: откройте два-три подходящих и сравните их между собой. Если сервис нужен для сайта, который должны находить люди и нейросети, напишите мне — помогу выбрать связку под задачу.</p>
          </div>
          <p className="mt-8 text-center text-sm"><Link href="/tools/" className="underline underline-offset-4">Все категории инструментов →</Link></p>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
