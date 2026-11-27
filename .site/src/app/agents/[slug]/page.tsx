import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Plug } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAgent, getAgents } from "@/lib/agents";
import { getPlugin } from "@/lib/plugins";
import { site } from "@/lib/site";
import { metaDesc, metaTitle } from "@/lib/utils";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { AgentSprite } from "@/components/agent-sprite";
import { breadcrumbs, faqSchema, graph, personId } from "@/lib/schema";

export function generateStaticParams() {
  const all = getAgents();
  return all.length ? all.map((a) => ({ slug: a.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getAgent(slug);
  if (!a) return {};
  return {
    title: metaTitle(a.title),
    description: metaDesc(a.description),
    alternates: { canonical: `/agents/${a.slug}/` },
    openGraph: { type: "article", title: a.title, description: metaDesc(a.description) },
  };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getAgent(slug);
  if (!a) notFound();

  const plugins = a.plugins.map((s) => getPlugin(s)).filter((x): x is NonNullable<typeof x> => !!x);
  const peers = getAgents().filter((x) => x.floor.number === a.floor.number && x.slug !== a.slug);
  const url = `/agents/${a.slug}/`;

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "Article",
            headline: a.title,
            description: a.description,
            url: `${site.url}${url}`,
            inLanguage: "ru-RU",
            author: { "@id": personId },
            about: { "@type": "Thing", name: a.emp.name, description: a.emp.role },
          },
          ...(a.faq.length ? [faqSchema(a.faq)] : []),
          breadcrumbs([
            { name: "Главная", path: "/" },
            { name: "Библиотеки", path: "/libraries/" },
            { name: "ИИ-агенты", path: "/agents/" },
            { name: a.emp.name, path: url },
          ]),
        )}
      />
      <Section className="pt-12">
        <Container className="max-w-4xl">
          <nav aria-label="Хлебные крошки" className="mb-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/libraries/" className="hover:text-foreground">Библиотеки</Link> / <Link href="/agents/" className="hover:text-foreground">ИИ-агенты</Link>
          </nav>

          <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border bg-card p-6 text-center sm:flex-row sm:items-start sm:gap-6 sm:p-8 sm:text-left">
            <span className="inline-flex size-24 shrink-0 items-center justify-center rounded-2xl border bg-muted/60 p-3">
              <AgentSprite emp={a.emp} staticOnly className="w-12" />
            </span>
            <div className="mt-4 min-w-0 flex-1 sm:mt-0">
              <p className="font-mono text-xs uppercase tracking-wider text-brand">
                {a.floor.number} этаж · {a.floor.title}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{a.emp.name}</h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{a.emp.tool} · {a.emp.role}</p>
              <p className="mt-4 rounded-xl border bg-background px-4 py-3 text-sm text-foreground">
                «{a.emp.speech}»
              </p>
            </div>
          </div>

          {a.outputs.length > 0 && (
            <div className="mx-auto mt-6 max-w-3xl rounded-xl border bg-card p-5">
              <p className="text-sm font-medium text-muted-foreground">Что агент выдаёт на выходе</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {a.outputs.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plugins.length > 0 && (
            <section className="mx-auto mt-8 max-w-3xl">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold tracking-tight">Плагины и инструменты агента</h2>
                <Link href="/plugins/" className="text-sm text-brand hover:underline">Все плагины →</Link>
              </div>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {plugins.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/plugins/${p.slug}/`} className="group flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:border-brand/40">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-semibold group-hover:text-brand">
                          <Plug className="size-4 text-brand" />
                          {p.name}
                        </span>
                        <span className="rounded-full border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{p.kind}</span>
                      </div>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.short}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand">
                        Инструкция по установке<ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <article className="prose-site mx-auto mt-10 max-w-3xl [&_pre]:whitespace-pre-wrap">
            <Markdown remarkPlugins={[remarkGfm]}>{a.body}</Markdown>
          </article>

          {peers.length > 0 && (
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-semibold tracking-tight">Коллеги на этаже «{a.floor.title}»</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {peers.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/agents/${p.slug}/`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-brand/40">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted/60 p-1.5">
                        <AgentSprite emp={p.emp} staticOnly className="w-6" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold group-hover:text-brand">{p.emp.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{p.emp.role}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-center text-sm"><Link href="/agents/" className="text-brand hover:underline">Все 13 ИИ-агентов →</Link></p>
            </div>
          )}
        </Container>
      </Section>
      <Cta offer={a.offer} defaultTask={`Настройка системы как у агента «${a.emp.name}»`} />
    </>
  );
}
