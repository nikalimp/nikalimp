import { metaDesc, metaTitle } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDate, getPost, getPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph, orgId, personId } from "@/lib/schema";
import { linkTerms } from "@/lib/glossary";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return {
    title: metaTitle(p.seoTitle ?? p.title),
    description: metaDesc(p.description),
    alternates: { canonical: `/blog/${p.slug}/` },
    openGraph: { type: "article", title: p.title, description: metaDesc(p.description), publishedTime: p.date, modifiedTime: p.updated ?? p.date, ...(p.cover ? { images: [{ url: `${site.url}${p.cover}`, width: 1200, height: 630, alt: p.coverAlt ?? p.title }] } : {}) },
    ...(p.cover ? { twitter: { card: "summary_large_image", images: [`${site.url}${p.cover}`] } } : {}),
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();
  const path = `/blog/${p.slug}/`;
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "BlogPosting", headline: p.title, description: p.description, datePublished: p.date, dateModified: p.updated ?? p.date, inLanguage: "ru-RU", ...(p.cover ? { image: `${site.url}${p.cover}` } : {}), url: `${site.url}${path}`, mainEntityOfPage: `${site.url}${path}`, author: { "@id": personId }, publisher: { "@id": orgId } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Блог", path: "/blog/" }, { name: p.title, path }]),
        )}
      />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <nav className="mb-6 text-sm text-muted-foreground text-center"><Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/blog/" className="hover:text-foreground">Блог</Link></nav>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">{p.title}</h1>
          <p className="mt-4 text-sm text-muted-foreground text-center mx-auto max-w-2xl">
            <Link href="/cases/" className="hover:text-foreground">{site.person}</Link> · {formatDate(p.date)}
            {p.updated && p.updated !== p.date && <> · обновлено {formatDate(p.updated)}</>}
          </p>
          {p.cover && (
            <img src={p.cover} alt={p.coverAlt ?? p.title} width={1200} height={630} className="mt-8 aspect-[40/21] w-full rounded-xl border object-cover" />
          )}
          <article className="prose-site mt-10">
            <Markdown remarkPlugins={[remarkGfm]}>{linkTerms(p.body)}</Markdown>
          </article>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
