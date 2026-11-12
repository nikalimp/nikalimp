import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadMagnet } from "@/components/lead-magnet";
import { magnetFor } from "@/lib/lead-magnets";
import { termCollections } from "@/lib/collections";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getTerm, getTerms, linkTerms } from "@/lib/glossary";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph } from "@/lib/schema";
import { getTools } from "@/lib/tools";

export function generateStaticParams() {
  return getTerms().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getTerm(slug);
  if (!t) return {};
  return {
    title: t.metaTitle, description: t.metaDescription, alternates: { canonical: `/glossary/${t.slug}/` },
    openGraph: { type: "article", title: t.metaTitle, description: t.metaDescription },
  };
}

export default async function TermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTerm(slug);
  if (!t) notFound();
  const path = `/glossary/${t.slug}/`;
  const aka = [...new Set([t.expansion, t.en, ...t.synonyms])].filter((x) => x && x !== t.term);
  const collections = termCollections(t.category);
  // Одноимённый инструмент в каталоге: обзор, тарифы и аналоги живут там, термин на него ссылается
  const tool = getTools().find((x) => [t.term, t.en].some((n) => n && n.toLowerCase() === x.name.toLowerCase()));
  const sameCat = getTerms().filter((x) => x.category === t.category && x.slug !== t.slug && !t.related.some((r) => r.slug === x.slug));
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "DefinedTerm", "@id": `${site.url}${path}#term`, name: t.term, ...(aka.length ? { alternateName: aka } : {}), description: t.short, url: `${site.url}${path}`, inLanguage: "ru-RU", inDefinedTermSet: { "@type": "DefinedTermSet", "@id": `${site.url}/glossary/#set`, name: "Глоссарий NikAlimp", url: `${site.url}/glossary/` } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Глоссарий", path: "/glossary/" }, { name: t.term, path }]),
        )}
      />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <nav className="mb-6 text-sm text-muted-foreground text-center"><Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/glossary/" className="hover:text-foreground">Глоссарий</Link></nav>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">{t.term}</h1>
          {aka.length > 0 && <p className="mt-3 text-muted-foreground text-center mx-auto max-w-2xl">{aka.join(" · ")}</p>}
          <article className="prose-site mt-8">
            <Markdown remarkPlugins={[remarkGfm]}>{linkTerms(t.body, { exclude: t.slug, max: 5 })}</Markdown>
          </article>
          {tool && (
            <Link href={`/tools/${tool.slug}/`} className="mt-8 flex items-center justify-between gap-4 rounded-xl border p-5 hover:bg-accent">
              <span><span className="block font-semibold">{tool.name}: обзор, тарифы и аналоги</span><span className="mt-1 block text-sm text-muted-foreground">Цены, работа из России, плюсы и минусы — в каталоге инструментов</span></span>
              <span aria-hidden className="text-muted-foreground">→</span>
            </Link>
          )}
          {/* Термины про нейросети ведут на GEO-проверку: /geo-audit/ — главная услуга (Search Console 9.11) */}
          <LeadMagnet kind={/AI и LLM/.test(t.category) ? "geo-audit" : magnetFor(t.category)} className="mt-10" />
          {t.related.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-3 text-lg font-semibold">Связанные термины</h2>
              <div className="flex flex-wrap gap-2">
                {t.related.map((r) => (
                  <Link key={r.slug} href={`/glossary/${r.slug}/`} className="rounded-full border px-3 py-1 text-sm hover:bg-accent">{r.term}</Link>
                ))}
              </div>
            </div>
          )}
          {collections.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-lg font-semibold">Подборки по теме</h2>
              <ul className="space-y-2 text-sm">{collections.map((c) => <li key={c.href}><Link href={c.href} className="underline-offset-4 hover:underline">{c.title}</Link><span className="text-muted-foreground"> — {c.text}</span></li>)}</ul>
            </div>
          )}
          {sameCat.length > 0 && (
            <div className="mt-10 border-t pt-8">
              <h2 className="mb-3 text-lg font-semibold">Ещё в разделе «{t.category}»</h2>
              <ul className="grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                {sameCat.slice(0, 12).map((x) => (
                  <li key={x.slug}><Link href={`/glossary/${x.slug}/`} className="hover:text-foreground">{x.term}</Link></li>
                ))}
              </ul>
              <p className="mt-4 text-sm"><Link href="/glossary/" className="underline underline-offset-4">Все термины →</Link></p>
            </div>
          )}
        </Container>
      </Section>
      <Cta />
    </>
  );
}
