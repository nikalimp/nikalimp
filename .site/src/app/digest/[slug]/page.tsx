import { metaDesc, metaTitle } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getDigest, getDigests } from "@/lib/digests";
import { formatDate } from "@/lib/posts";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph, orgId, personId } from "@/lib/schema";

export function generateStaticParams() {
  const all = getDigests();
  return all.length ? all.map((d) => ({ slug: d.slug })) : [{ slug: "none" }]; // статический экспорт требует хотя бы один адрес; «none» отдаёт 404
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = getDigest(slug);
  if (!d) return {};
  return {
    title: metaTitle(d.title),
    description: metaDesc(d.description),
    alternates: { canonical: `/digest/${d.slug}/` },
    openGraph: { type: "article", title: d.title, description: metaDesc(d.description), publishedTime: d.date },
  };
}

export default async function DigestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getDigest(slug);
  if (!d) notFound();
  const path = `/digest/${d.slug}/`;
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "BlogPosting", headline: d.title, description: d.description, datePublished: d.date, dateModified: d.date, inLanguage: "ru-RU", url: `${site.url}${path}`, mainEntityOfPage: `${site.url}${path}`, author: { "@id": personId }, publisher: { "@id": orgId } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Дайджест", path: "/digest/" }, { name: d.title, path }]),
        )}
      />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <nav className="mb-6 text-sm text-muted-foreground text-center">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/digest/" className="hover:text-foreground">Дайджест</Link>
          </nav>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">{d.title}</h1>
          <p className="mt-4 text-sm text-muted-foreground text-center mx-auto max-w-2xl">
            <Link href="/cases/" className="hover:text-foreground">{site.person}</Link> · {formatDate(d.date)}
          </p>
          <article className="prose-site mt-10">
            <Markdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} {...(href?.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>{children}</a> }}>
              {d.body}
            </Markdown>
          </article>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
