import type { Metadata } from "next";
import Link from "next/link";
import { getSubcategories, getToolCategories, getToolLetters, getTools } from "@/lib/tools";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Каталог инструментов для SEO, GEO, веба и дизайна",
  description: "Сервисы для SEO и GEO, нейросети, конструкторы сайтов, хостинг, дизайн и фриланс: что умеет каждый, сколько стоит, работает ли из России и чем заменить.",
  alternates: { canonical: "/tools/" },
};

export default function ToolsIndex() {
  const tools = getTools();
  const categories = getToolCategories();
  const subs = getSubcategories();
  const letters = getToolLetters();
  const groups = letters.filter((l) => l.active).map((l, i) => ({ ...l, id: `l${i}`, items: tools.filter((t) => t.letter === l.letter) }));
  const idOf = new Map(groups.map((g) => [g.letter, g.id]));
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "ItemList", "@id": `${site.url}/tools/#list`, name: "Каталог инструментов NikAlimp", url: `${site.url}/tools/`, numberOfItems: tools.length, itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: `${site.url}/tools/${t.slug}/` })) },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Инструменты", path: "/tools/" }]),
        )}
      />
      <Section className="pt-12">
        <Container>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">Инструменты для SEO, GEO, веба и дизайна</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-center mx-auto">Сервисы, с которыми я работаю или которые встречаю в проектах клиентов: поиск и аналитика, нейросети, конструкторы сайтов, хостинг, дизайн, CRM и фриланс. По каждому — что умеет, кому подходит, сколько стоит, работает ли из России и чем заменить. Сейчас в каталоге {tools.length} инструментов, он пополняется.</p>

          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">По категориям</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <div key={c.name} className="card rounded-lg border p-4">
                  <p className="font-medium">{c.name} <span className="ml-1 font-mono text-xs text-muted-foreground">{c.tools.length}</span></p>
                  {subs.filter((g) => g.category === c.name).length > 0 && (
                    <p className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-xs">
                      {subs.filter((g) => g.category === c.name).map((g) => <Link key={g.slug} href={`/tools/c/${g.slug}/`} className="text-brand hover:underline">{g.name}</Link>)}
                    </p>
                  )}
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {c.tools.map((t) => (
                      <li key={t.slug}><Link href={`/tools/${t.slug}/`} className="hover:text-foreground">{t.name}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <h2 className="mt-12 text-lg font-semibold">По алфавиту</h2>
          <nav aria-label="Алфавит" className="sticky top-14 z-10 -mx-4 mt-3 flex flex-wrap gap-1 border-y bg-background/90 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
            {letters.map((l) =>
              l.active ? (
                <a key={l.letter} href={`#${idOf.get(l.letter)}`} className="inline-flex size-8 items-center justify-center rounded-md font-mono text-sm hover:bg-accent">{l.letter}</a>
              ) : (
                <span key={l.letter} className="inline-flex size-8 items-center justify-center font-mono text-sm text-muted-foreground/40">{l.letter}</span>
              ),
            )}
          </nav>
          <div className="mt-6 space-y-12">
            {groups.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-32">
                <h3 className="mb-4 font-mono text-2xl font-semibold">{g.letter}</h3>
                <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {g.items.map((t) => (
                    <li key={t.slug}>
                      <Link href={`/tools/${t.slug}/`} className="group block">
                        <span className="font-medium group-hover:underline group-hover:underline-offset-4">{t.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{t.subcategory}</span>
                        <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{t.short}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
