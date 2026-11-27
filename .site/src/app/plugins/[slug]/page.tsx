import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Plug, Terminal } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPlugin, getPlugins } from "@/lib/plugins";
import { getAgent } from "@/lib/agents";
import { site } from "@/lib/site";
import { metaDesc, metaTitle } from "@/lib/utils";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { AgentSprite } from "@/components/agent-sprite";
import { breadcrumbs, faqSchema, graph, personId } from "@/lib/schema";

export function generateStaticParams() {
  const all = getPlugins();
  return all.length ? all.map((p) => ({ slug: p.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPlugin(slug);
  if (!p) return {};
  return {
    title: metaTitle(p.title),
    description: metaDesc(p.description),
    alternates: { canonical: `/plugins/${p.slug}/` },
    openGraph: { type: "article", title: p.title, description: metaDesc(p.description) },
  };
}

export default async function PluginDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPlugin(slug);
  if (!p) notFound();

  const agents = p.agents.map((id) => getAgent(id)).filter((x): x is NonNullable<typeof x> => !!x);
  const allPlugins = getPlugins();
  const related = p.related.map((r) => allPlugins.find((x) => x.slug === r)).filter((x): x is NonNullable<typeof x> => !!x);
  const url = `/plugins/${p.slug}/`;

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "SoftwareApplication",
            name: p.name,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "macOS, Linux, Windows",
            description: p.description,
            url: `${site.url}${url}`,
            author: { "@id": personId },
          },
          ...(p.faq.length ? [faqSchema(p.faq)] : []),
          breadcrumbs([
            { name: "Главная", path: "/" },
            { name: "Библиотеки", path: "/libraries/" },
            { name: "Плагины и MCP", path: "/plugins/" },
            { name: p.name, path: url },
          ]),
        )}
      />
      <Section className="pt-12">
        <Container className="max-w-4xl">
          <nav aria-label="Хлебные крошки" className="mb-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/libraries/" className="hover:text-foreground">Библиотеки</Link> / <Link href="/plugins/" className="hover:text-foreground">Плагины и MCP</Link>
          </nav>

          <p className="text-center font-mono text-xs uppercase tracking-wider text-brand">{p.category} · {p.kind}</p>
          <h1 className="mx-auto mt-2 max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">{p.name}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-muted-foreground">{p.short}</p>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
            {p.install && (
              <div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Terminal className="size-4 text-brand" />Быстрая установка
                </p>
                <pre className="mt-2 overflow-x-auto rounded-lg border bg-background px-3 py-2 font-mono text-xs">{p.install}</pre>
              </div>
            )}
            {p.worksWith.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Совместимость</p>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {p.worksWith.map((w) => (
                    <span key={w} className="rounded-full border bg-background px-2.5 py-0.5 text-xs">{w}</span>
                  ))}
                </p>
              </div>
            )}
          </div>

          {agents.length > 0 && (
            <section className="mx-auto mt-8 max-w-3xl">
              <h2 className="text-xl font-semibold tracking-tight">Какие ИИ-агенты используют этот плагин</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {agents.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/agents/${a.slug}/`} className="group flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-colors hover:border-brand/40">
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted/60 p-1.5">
                        <AgentSprite emp={a.emp} staticOnly className="w-7" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold group-hover:text-brand">{a.emp.name}</span>
                        <span className="block text-xs text-muted-foreground">{a.floor.number} этаж · {a.emp.role}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <article className="prose-site mx-auto mt-10 max-w-3xl [&_pre]:whitespace-pre-wrap">
            <Markdown remarkPlugins={[remarkGfm]}>{p.body}</Markdown>
          </article>

          {related.length > 0 && (
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-semibold tracking-tight">Похожие плагины</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/plugins/${r.slug}/`} className="group block h-full rounded-xl border bg-card p-4 transition-colors hover:border-brand/40">
                      <span className="inline-flex items-center gap-1.5 font-semibold group-hover:text-brand">
                        <Plug className="size-3.5 text-brand" />{r.name}
                      </span>
                      <span className="mt-1.5 block text-xs text-muted-foreground">{r.short}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-center text-sm"><Link href="/plugins/" className="text-brand hover:underline">Все плагины и MCP →</Link></p>
            </div>
          )}
        </Container>
      </Section>
      <Cta offer="service" defaultTask={`Подключение плагина «${p.name}» и настройка агентов`} />
    </>
  );
}
