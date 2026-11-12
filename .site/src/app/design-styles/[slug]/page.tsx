import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadMagnet } from "@/components/lead-magnet";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getDesignStyle, getDesignStyles } from "@/lib/design-styles";
import { site } from "@/lib/site";
import { metaDesc, metaTitle } from "@/lib/utils";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { StyleCover } from "@/components/style-cover";
import { breadcrumbs, faqSchema, graph, personId } from "@/lib/schema";

export function generateStaticParams() {
  const all = getDesignStyles();
  return all.length ? all.map((s) => ({ slug: s.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getDesignStyle(slug);
  if (!s) return {};
  return { title: metaTitle(s.title || s.name), description: metaDesc(s.description), alternates: { canonical: `/design-styles/${s.slug}/` }, openGraph: { type: "article", title: s.title, description: metaDesc(s.description) } };
}

export default async function DesignStylePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getDesignStyle(slug);
  if (!s) notFound();
  const all = getDesignStyles();
  const related = s.related.map((r) => all.find((x) => x.slug === r)).filter((x): x is NonNullable<typeof x> => !!x);
  const url = `/design-styles/${s.slug}/`;
  return (
    <>
      <JsonLd data={graph(
        { "@type": "Article", headline: s.title || s.name, description: s.description, url: `${site.url}${url}`, inLanguage: "ru-RU", author: { "@id": personId }, about: { "@type": "Thing", name: s.name, alternateName: s.also } },
        ...(s.faq.length ? [faqSchema(s.faq)] : []),
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "Библиотеки", path: "/libraries/" }, { name: "Дизайн-направления", path: "/design-styles/" }, { name: s.name, path: url }]),
      )} />
      <Section className="pt-12">
        <Container className="max-w-4xl">
          <nav aria-label="Хлебные крошки" className="mb-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/libraries/" className="hover:text-foreground">Библиотеки</Link> / <Link href="/design-styles/" className="hover:text-foreground">Дизайн-направления</Link>
          </nav>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">{s.name}</h1>
          {s.also.length > 0 && <p className="mt-3 text-center text-sm text-muted-foreground">Ещё называют: {s.also.join(", ")}</p>}
          <StyleCover slug={s.slug} className="mx-auto mt-8 max-w-3xl rounded-2xl border shadow-sm" />
          {(s.palette.length > 0 || s.fonts.length > 0) && (
            <div className="mx-auto mt-6 grid max-w-3xl gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
              {s.palette.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Палитра</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {s.palette.map((c) => (
                      <li key={c} className="text-center">
                        <span className="block size-10 rounded-lg border shadow-sm" style={{ background: c }} />
                        <span className="mt-1 block font-mono text-[11px] text-muted-foreground">{c.toUpperCase()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {s.fonts.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Шрифты с кириллицей</p>
                  <p className="mt-2 flex flex-wrap gap-2">{s.fonts.map((f) => <span key={f} className="rounded-full border bg-background px-3 py-1 text-sm">{f}</span>)}</p>
                </div>
              )}
            </div>
          )}
          <article className="prose-site mx-auto mt-10 max-w-3xl [&_pre]:whitespace-pre-wrap">
            <Markdown remarkPlugins={[remarkGfm]}>{s.body}</Markdown>
          </article>
          <LeadMagnet kind="style-concept" name={s.name} className="mx-auto mt-10 max-w-3xl" />
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-center text-2xl font-semibold tracking-tight">Похожие направления</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/design-styles/${r.slug}/`} className="group block overflow-hidden rounded-xl border bg-card hover:border-brand/40">
                      <StyleCover slug={r.slug} />
                      <span className="block p-4"><span className="block font-semibold group-hover:text-brand">{r.name}</span><span className="mt-1 block text-sm text-muted-foreground">{r.short}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-center text-sm"><Link href="/design-styles/" className="text-brand hover:underline">Все дизайн-направления →</Link></p>
            </div>
          )}
        </Container>
      </Section>
      <Cta />
    </>
  );
}
