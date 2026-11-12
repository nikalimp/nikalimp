import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStartupBase, getStartupCategoryPages, hasStartupPage, plural, startupsIn } from "@/lib/startups";
import { site } from "@/lib/site";
import { metaTitle } from "@/lib/utils";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { CategoryTabs, StartupCard } from "@/components/startup-parts";
import { StartupSearch } from "@/components/startup-search";
import { breadcrumbs, graph } from "@/lib/schema";

// Страница категории базы стартапов: «CRM», «Нейросети», «Телеграм-боты»… — под запросы «российские X»
export function generateStaticParams() {
  const all = getStartupCategoryPages();
  return all.length ? all.map((c) => ({ cat: c.slug })) : [{ cat: "none" }];
}

const find = (slug: string) => getStartupCategoryPages().find((c) => c.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }): Promise<Metadata> {
  const { cat } = await params;
  const c = find(cat);
  if (!c) return {};
  const n = `${c.count} ${plural(c.count, "проект", "проекта", "проектов")}`;
  return {
    title: metaTitle(`${c.name}: российские стартапы и сервисы`),
    description: `${c.name}: ${n} российских команд 2026 года — что делает каждый продукт, для кого он и какую задачу решает. База стартапов NikAlimp.`.slice(0, 160),
    alternates: { canonical: `/startups/c/${c.slug}/` },
  };
}

export default async function StartupCategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params;
  const c = find(cat);
  if (!c) notFound();
  const b = getStartupBase();
  const items = startupsIn(c.slug).filter((i) => hasStartupPage(i.s));
  const parent = c.parent ? b.categories.find((x) => x.slug === c.parent) : undefined;
  const scope = [c.slug, ...b.categories.filter((x) => x.parent === c.slug).map((x) => x.slug)];
  const cats = Object.fromEntries(b.categories.map((x) => [x.slug, x.name]));
  const total = b.items.filter((i) => hasStartupPage(i.s)).length;
  const p = `/startups/c/${c.slug}/`;
  return (
    <>
      <JsonLd data={graph(
        { "@type": "ItemList", name: `${c.name}: российские стартапы`, url: `${site.url}${p}`, numberOfItems: items.length, itemListElement: items.slice(0, 100).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.n, url: `${site.url}/startups/${it.s}/` })) },
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "База стартапов", path: "/startups/" }, ...(parent ? [{ name: parent.name, path: `/startups/c/${parent.slug}/` }] : []), { name: c.name, path: p }]),
      )} />
      <Section className="pt-12">
        <Container>
          <nav aria-label="Хлебные крошки" className="mb-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/startups/" className="hover:text-foreground">База стартапов</Link>
            {parent && <> / <Link href={`/startups/c/${parent.slug}/`} className="hover:text-foreground">{parent.name}</Link></>}
          </nav>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">{c.name}: российские стартапы</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {items.length} {plural(items.length, "российский проект", "российских проекта", "российских проектов")} 2026 года в категории «{c.name}». На странице каждого — что он делает, для кого и какую задачу решает.
          </p>
          <CategoryTabs categories={getStartupCategoryPages()} total={total} active={c.slug} />
          <StartupSearch cats={cats} scope={scope}>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((it) => <StartupCard key={it.s} it={it} cats={cats} />)}</ul>
          </StartupSearch>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">Хотите добавить свой проект или нашли ошибку — <a href={site.telegram} target="_blank" rel="noopener" className="text-brand hover:underline">напишите мне</a>.</p>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
