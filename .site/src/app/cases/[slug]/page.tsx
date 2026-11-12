import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight } from "lucide-react";
import { getCaseStudies, getCaseStudy, type CaseStudy } from "@/lib/case-studies";
import { site } from "@/lib/site";
import { metaDesc, metaTitle } from "@/lib/utils";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph, personId } from "@/lib/schema";

export function generateStaticParams() {
  const all = getCaseStudies();
  return all.length ? all.map((c) => ({ slug: c.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) return {};
  return {
    title: metaTitle(c.title),
    description: metaDesc(c.description),
    alternates: { canonical: `/cases/${c.slug}/` },
    openGraph: { type: "article", title: c.title, description: metaDesc(c.description), ...(c.cover ? { images: [{ url: `${site.url}${c.cover}`, width: 1440, height: 900, alt: c.title }] } : {}) },
    ...(c.cover ? { twitter: { card: "summary_large_image", images: [`${site.url}${c.cover}`] } } : {}),
  };
}

/** Инфографика: ключевые цифры проекта. */
function Metrics({ c }: { c: CaseStudy }) {
  if (!c.metrics.length) return null;
  return (
    <div className={`mt-8 grid gap-3 ${c.metrics.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
      {c.metrics.map((m) => (
        <div key={m.label} className="rounded-xl border bg-card p-5 text-center">
          <p className="text-3xl font-semibold tracking-tight text-brand">{m.value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Паспорт проекта. */
function Facts({ c }: { c: CaseStudy }) {
  const rows: [string, React.ReactNode][] = [
    ["Клиент", c.client], ["Отрасль", c.industry], ["Тип", c.type], ["Год", c.year],
    ...(c.duration ? [["Срок", c.duration] as [string, React.ReactNode]] : []),
    ["Моя роль", c.role], ["Статус", c.phase ? `${c.status}: ${c.phase.charAt(0).toLowerCase()}${c.phase.slice(1)}` : c.status],
    ...(c.site ? [["Сайт", <a key="s" href={c.site} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-brand hover:underline">{c.site.replace(/^https?:\/\//, "").replace(/\/$/, "")}<ArrowUpRight className="size-3.5" /></a>] as [string, React.ReactNode]] : []),
  ];
  return (
    <dl className="mt-8 grid gap-x-6 gap-y-3 rounded-xl border bg-card p-5 text-sm sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-3 border-b pb-3 last:border-0 sm:[&:nth-last-child(2)]:border-0">
          <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Инфографика: этапы работы таймлайном. */
function Stages({ c }: { c: CaseStudy }) {
  if (!c.stages.length) return null;
  return (
    <div className="not-prose my-10">
      <h2 className="mb-5 text-2xl font-semibold tracking-tight">Как шла работа</h2>
      <ol className="relative m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {c.stages.map((s, i) => (
          <li key={s.title} className="relative m-0 rounded-xl border bg-card p-5 pl-5">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">{i + 1}</span>
            <p className="mt-3 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stack({ c }: { c: CaseStudy }) {
  if (!c.stack.length) return null;
  return (
    <div className="mt-10">
      <h2 className="mb-3 text-xl font-semibold tracking-tight">Технологии</h2>
      <div className="flex flex-wrap gap-2">{c.stack.map((s) => <span key={s} className="rounded-full border bg-background px-3 py-1 text-sm">{s}</span>)}</div>
    </div>
  );
}

// Глоссарий в кейсах не подсвечиваем: тексты про конкретный проект, ссылки на термины отвлекают
const md = (s: string) => <Markdown remarkPlugins={[remarkGfm]}>{s}</Markdown>;

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCaseStudy(slug);
  if (!c) notFound();
  const url = `/cases/${c.slug}/`;
  // Таймлайн этапов встаёт перед разделом «Решение», если он есть
  // Обложка уже стоит над текстом — убираем её повтор из тела вместе с подписью
  const body = c.cover ? c.body.replace(new RegExp(`\\n?!\\[[^\\]]*\\]\\(${c.cover.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)\\n(\\*[^\\n]*\\*\\n)?`), "\n") : c.body;
  const cut = body.search(/^##\s+Решение/m);
  const [before, after] = cut > 0 ? [body.slice(0, cut), body.slice(cut)] : [body, ""];
  const others = getCaseStudies().filter((x) => x.slug !== c.slug).slice(0, 3);
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "CreativeWork", name: c.title, headline: c.title, description: c.description, url: `${site.url}${url}`, ...(c.cover ? { image: `${site.url}${c.cover}` } : {}), dateCreated: c.year, inLanguage: "ru-RU", creator: { "@id": personId }, about: { "@type": "Organization", name: c.client, ...(c.site ? { url: c.site } : {}) }, keywords: c.stack.join(", ") },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Кейсы", path: "/cases/" }, { name: c.client, path: url }]),
        )}
      />
      <Section className="pt-12">
        <Container className="max-w-4xl">
          <nav className="mb-6 text-center text-sm text-muted-foreground"><Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/cases/" className="hover:text-foreground">Кейсы</Link></nav>
          <p className="text-center"><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.status === "Запущен" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400"}`}>{c.type} · {c.status}</span></p>
          <h1 className="mx-auto mt-4 max-w-3xl text-balance text-center text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{c.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">{c.description}</p>
          {c.cover && <img src={c.cover} alt={`${c.client}: первый экран сайта`} width={1440} height={900} className="mt-8 w-full rounded-xl border shadow-sm" />}
          <Metrics c={c} />
          <Facts c={c} />
          <article className="prose-site mx-auto mt-12 max-w-3xl">
            {md(before)}
            <Stages c={c} />
            {after && md(after)}
            <Stack c={c} />
          </article>
          {others.length > 0 && (
            <div className="mt-16">
              <h2 className="mb-4 text-center text-xl font-semibold tracking-tight">Другие кейсы</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {others.map((o) => (
                  <Link key={o.slug} href={`/cases/${o.slug}/`} className="group overflow-hidden rounded-xl border bg-card hover:border-brand/40">
                    {o.cover && <img src={o.cover} alt="" width={1440} height={900} loading="lazy" className="aspect-[16/10] w-full object-cover object-top" />}
                    <div className="p-4"><p className="font-semibold group-hover:text-brand">{o.client}</p><p className="mt-1 text-sm text-muted-foreground">{o.type}</p></div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>
      <Cta />
    </>
  );
}
