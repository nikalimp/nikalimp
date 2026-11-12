import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadMagnet } from "@/components/lead-magnet";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight } from "lucide-react";
import { getStartupBase, getStartupCategoryPages, getStartupPage, getStartupsWithPages, similarStartups } from "@/lib/startups";
import { site } from "@/lib/site";
import { metaDesc, metaTitle } from "@/lib/utils";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { StartupCard, initial } from "@/components/startup-parts";
import { breadcrumbs, faqSchema, graph } from "@/lib/schema";

// Страница проекта базы стартапов — под запрос с его названием: что это, для кого, какую задачу решает, похожие проекты
export function generateStaticParams() {
  const all = getStartupsWithPages();
  return all.length ? all.map((i) => ({ slug: i.s })) : [{ slug: "none" }];
}

const find = (slug: string) => getStartupsWithPages().find((i) => i.s === slug);
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

// Сниппет карточки: к названию добавляем «обзор и аналоги», если влезает в 65 знаков, к описанию — «ссылка на сайт и похожие сервисы».
// По брендовым запросам карточки стоят на 6-й позиции с CTR около 1 % (Search Console 9.11): человек ищет обзор и сам сервис.
function startupTitle(t: string) {
  return [`${t}: обзор и аналоги`, `${t}: обзор`].find((v) => v.length <= 65) ?? t;
}
function startupDesc(d: string, hasSite: boolean) {
  const base = metaDesc(d);
  const tail = hasSite ? "Ссылка на сайт и похожие сервисы." : "Похожие сервисы и аналоги.";
  return /[.!?]$/.test(base) && `${base} ${tail}`.length <= 160 ? `${base} ${tail}` : base;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const it = find(slug);
  const pg = getStartupPage(slug);
  if (!it || !pg) return {};
  return {
    title: metaTitle(startupTitle(pg.title || `${it.n}: что это за сервис и для кого`)),
    description: startupDesc(pg.description || it.t, !!it.w),
    alternates: { canonical: `/startups/${it.s}/` },
    openGraph: { type: "article", title: pg.title || it.n, description: metaDesc(pg.description || it.t) },
  };
}

export default async function StartupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const it = find(slug);
  const pg = getStartupPage(slug);
  if (!it || !pg) notFound();
  const b = getStartupBase();
  const cats = Object.fromEntries(b.categories.map((c) => [c.slug, c.name]));
  const pagesSet = new Set(getStartupCategoryPages().map((c) => c.slug));
  const main = b.categories.find((c) => c.slug === it.c[0]);
  const top = main?.parent ? b.categories.find((c) => c.slug === main.parent) : main;
  const similar = similarStartups(it);
  const url = `/startups/${it.s}/`;
  const rel = pg.follow ? "noopener" : "nofollow noopener";
  const facts: [string, React.ReactNode][] = [
    ["Категории", <span key="c" className="flex flex-wrap gap-x-2 gap-y-1">{it.c.map((c, i) => pagesSet.has(c) ? <Link key={c} href={`/startups/c/${c}/`} className="text-brand hover:underline">{cats[c]}{i < it.c.length - 1 ? "," : ""}</Link> : <span key={c}>{cats[c]}{i < it.c.length - 1 ? "," : ""}</span>)}</span>],
    ...(it.p ? [["Цена", it.p] as [string, React.ReactNode]] : []),
    ...(it.city ? [["Команда", it.city] as [string, React.ReactNode]] : []),
    ...(it.w ? [["Сайт", <a key="w" href={it.w} target="_blank" rel={rel} className="inline-flex items-center gap-1 text-brand hover:underline">{host(it.w)}<ArrowUpRight className="size-3.5" /></a>] as [string, React.ReactNode]] : []),
  ];
  return (
    <>
      <JsonLd data={graph(
        { "@type": "SoftwareApplication", name: it.n, description: pg.description || it.t, url: `${site.url}${url}`, ...(it.w ? { sameAs: it.w } : {}), applicationCategory: top?.name ?? "BusinessApplication", operatingSystem: "Web", inLanguage: "ru-RU", ...(it.p === "Бесплатно" ? { offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } } : {}) },
        ...(pg.faq.length ? [faqSchema(pg.faq)] : []),
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "База стартапов", path: "/startups/" }, ...(top && pagesSet.has(top.slug) ? [{ name: top.name, path: `/startups/c/${top.slug}/` }] : []), { name: it.n, path: url }]),
      )} />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <nav aria-label="Хлебные крошки" className="mb-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/startups/" className="hover:text-foreground">База стартапов</Link>
            {top && pagesSet.has(top.slug) && <> / <Link href={`/startups/c/${top.slug}/`} className="hover:text-foreground">{top.name}</Link></>}
          </nav>
          <div className="flex items-start gap-4">
            <span aria-hidden className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-bg text-2xl font-semibold text-brand">{initial(it.n)}</span>
            <div className="min-w-0">
              <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{it.n}</h1>
              {it.t && <p className="mt-2 text-lg text-muted-foreground">{it.t}</p>}
            </div>
          </div>
          {it.w && (
            <a href={it.w} target="_blank" rel={rel} className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90">
              Перейти на сайт {it.n}<ArrowUpRight className="size-4" />
            </a>
          )}
          <dl className="mt-8 grid gap-3 rounded-xl border bg-card p-5 text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
                <dd className="min-w-0 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <article className="prose-site mt-10">
            <Markdown remarkPlugins={[remarkGfm]}>{pg.body}</Markdown>
          </article>
          <LeadMagnet kind="founder" name={it.n} url={it.w} className="mt-10" />
        </Container>
        {similar.length > 0 && (
          <Container className="mt-16">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Похожие проекты</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{similar.map((s) => <StartupCard key={s.s} it={s} cats={cats} />)}</ul>
            {top && pagesSet.has(top.slug) && <p className="mt-6 text-center text-sm"><Link href={`/startups/c/${top.slug}/`} className="text-brand hover:underline">Все проекты в категории «{top.name}» →</Link></p>}
          </Container>
        )}
      </Section>
      <Cta />
    </>
  );
}
