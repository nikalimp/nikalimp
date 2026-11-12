import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, ArrowUpRight, Minus, Plus, Send, ThumbsDown, ThumbsUp, Trophy } from "lucide-react";
import { getComparePairs, getSubcategories, getTool, getTools, headingId, RUSSIA_OK, type Tool } from "@/lib/tools";
import { getPosts } from "@/lib/posts";
import { getTerms, linkTerms } from "@/lib/glossary";
import { LeadMagnet } from "@/components/lead-magnet";
import { magnetFor } from "@/lib/lead-magnets";
import { toolCta, toolFreebies } from "@/lib/tool-context";
import { toolCollections } from "@/lib/collections";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";
import { Chip, RussiaBadge, ToolLink, ToolMark, shortPrice } from "@/components/tool-parts";
import { breadcrumbs, faqSchema, graph, personId } from "@/lib/schema";

export function generateStaticParams() {
  return getTools().map((t) => ({ slug: t.slug }));
}

const ogFile = (slug: string) => path.join(process.cwd(), "public", "og", "tools", `${slug}.png`);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getTool(slug);
  if (!t) return {};
  const og = fs.existsSync(ogFile(t.slug)) ? [{ url: `/og/tools/${t.slug}.png`, width: 1200, height: 630, alt: t.name }] : undefined;
  return {
    title: t.metaTitle, description: t.metaDescription, alternates: { canonical: `/tools/${t.slug}/` },
    openGraph: { type: "article", title: t.metaTitle, description: t.metaDescription, ...(og ? { images: og } : {}) },
  };
}

// Заголовки внутри описания получают id — на них ссылается оглавление
const md = (s: string) => (
  <Markdown remarkPlugins={[remarkGfm]} components={{ h3: ({ children }) => <h3 id={headingId(String(children))} className="scroll-mt-20">{children}</h3> }}>{s}</Markdown>
);
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("ru-RU") : "");
const cap = (x?: string) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x);
const nameRx = (name: string) => new RegExp(`(^|[^\\p{L}\\d])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^\\p{L}\\d]|$)`, "iu");

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTool(slug);
  if (!t) notFound();
  const all = getTools();
  const bySlug = new Map(all.map((x) => [x.slug, x]));
  const p = `/tools/${t.slug}/`;
  const sub = getSubcategories().find((g) => g.slug === t.subSlug);
  const analogs = t.analogs.map((a) => bySlug.get(a.slug)).filter((x): x is Tool => !!x);
  // в таблицу сравнения — сначала аналоги с расширенной карточкой
  const compareRows = [...analogs].sort((a, b) => Number(b.rich) - Number(a.rich)).slice(0, 5);
  const replacements = t.card.russia && !RUSSIA_OK(t.card.russia)
    ? analogs.filter((a) => RUSSIA_OK(a.card.russia) || (!a.card.russia && a.market.includes("Россия"))).slice(0, 4) : [];
  const pairs = getComparePairs().filter((x) => x.a.slug === t.slug || x.b.slug === t.slug);
  const together = t.together.map((r) => bySlug.get(r.slug)).filter((x): x is Tool => !!x);
  const sameCat = all.filter((x) => x.subSlug === t.subSlug && x.slug !== t.slug && !t.analogs.some((a) => a.slug === x.slug)).slice(0, 12);
  const posts = getPosts().filter((post) => nameRx(t.name).test(post.body) || post.body.includes(`/tools/${t.slug}/`)).slice(0, 3);
  const cta = toolCta(t.category);
  const freebies = toolFreebies(t.category);
  const collections = toolCollections(t.slug, t.subcategory);
  const freePlan = t.card.free?.toLowerCase();

  const facts = [
    { label: "Категория", value: `${t.category} · ${t.subcategory}` },
    t.price && { label: "Цена", value: t.price },
    t.russia && { label: "Работа из России", value: t.russia },
    t.card.platforms.length > 0 && { label: "Платформы", value: t.card.platforms.join(", ") },
  ].filter(Boolean) as { label: string; value: string }[];

  const app = {
    "@type": "SoftwareApplication", "@id": `${site.url}${p}#app`, name: t.name, applicationCategory: t.subcategory, description: t.short, url: `${site.url}${p}`,
    ...(t.site ? { sameAs: t.site } : {}), inLanguage: "ru-RU",
    ...(t.card.platforms.length ? { operatingSystem: t.card.platforms.join(", ") } : {}),
    ...(freePlan === "есть" ? { offers: { "@type": "Offer", price: "0", priceCurrency: "RUB", description: "Бесплатный план" } } : {}),
    ...(t.verdict.rating ? { review: { "@type": "Review", author: { "@id": personId }, reviewRating: { "@type": "Rating", ratingValue: t.verdict.rating.split("/")[0].trim(), bestRating: t.verdict.rating.split("/")[1]?.trim() || "5" }, reviewBody: t.verdict.summary } } : {}),
  };
  const crumbs = [{ name: "Главная", path: "/" }, { name: "Инструменты", path: "/tools/" }, ...(sub ? [{ name: sub.name, path: `/tools/c/${sub.slug}/` }] : []), { name: t.name, path: p }];

  return (
    <>
      <JsonLd data={graph(app, breadcrumbs(crumbs), ...(t.faq.length ? [faqSchema(t.faq)] : []))} />

      {/* 1. Шапка-паспорт */}
      <Section className="pt-12 pb-10">
        <Container className="max-w-3xl">
          <nav className="mb-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/tools/" className="hover:text-foreground">Инструменты</Link>
            {sub && <> / <Link href={`/tools/c/${sub.slug}/`} className="hover:text-foreground">{sub.name}</Link></>}
          </nav>
          <div className="flex flex-col items-center text-center">
            <ToolMark t={t} />
            <h1 className="mt-4 max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{t.name}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t.short}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <RussiaBadge status={t.card.russia} />
              {t.card.free && <Chip>Бесплатный план: {t.card.free}</Chip>}
              {t.card.ruLang && <Chip>Русский язык: {t.card.ruLang}</Chip>}
              {sub ? <Link href={`/tools/c/${sub.slug}/`} className="inline-flex items-center rounded-full border bg-background px-2.5 py-0.5 text-xs hover:bg-accent">{t.subcategory}</Link> : <Chip>{t.subcategory}</Chip>}
            </div>
            {t.href && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <a href={t.href} target="_blank" rel={t.isRef ? "sponsored nofollow noopener" : "noopener"} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Перейти на {t.siteLabel || "сайт"} <ArrowUpRight className="size-4" />
                </a>
                {t.isRef && <span className="text-xs text-muted-foreground">Партнёрская ссылка: при регистрации я могу получить вознаграждение, для вас условия не меняются.</span>}
              </div>
            )}
            {t.card.checked && (
              <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <img src="/avatar.webp" alt="" width={20} height={20} className="size-5 rounded-full object-cover" />
                <span><Link href="/contacts/#cv" className="hover:text-foreground">{site.person}</Link> · проверено {fmtDate(t.card.checked)}</span>
              </p>
            )}
          </div>
        </Container>
      </Section>

      <Section className="border-t pt-10">
        <Container className="max-w-3xl">
          {/* 2. Вердикт */}
          {(t.verdict.forWhom || t.verdict.notFor || t.verdict.summary) && (
            <div className="mb-10 grid gap-3 sm:grid-cols-3">
              {t.verdict.forWhom && <div className="rounded-xl border p-4"><p className="flex items-center gap-1.5 text-sm font-medium"><ThumbsUp className="size-4 text-brand" />Кому подходит</p><p className="mt-1.5 text-sm text-muted-foreground">{cap(t.verdict.forWhom)}</p></div>}
              {t.verdict.notFor && <div className="rounded-xl border p-4"><p className="flex items-center gap-1.5 text-sm font-medium"><ThumbsDown className="size-4 text-muted-foreground" />Кому не подходит</p><p className="mt-1.5 text-sm text-muted-foreground">{cap(t.verdict.notFor)}</p></div>}
              {t.verdict.summary && <div className="rounded-xl border border-brand/40 bg-brand-bg p-4"><p className="flex items-center gap-1.5 text-sm font-medium"><Trophy className="size-4 text-brand" />Итог{t.verdict.rating && ` · ${t.verdict.rating}`}</p><p className="mt-1.5 text-sm">{cap(t.verdict.summary)}</p></div>}
            </div>
          )}

          {/* 5. Оглавление */}
          {t.toc.length >= 3 && (
            <nav aria-label="Содержание" className="mb-8 rounded-xl border bg-card p-4 text-sm">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Содержание</p>
              <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {t.toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="hover:text-brand">{h.title}</a></li>)}
                {(t.pros.length > 0 || t.cons.length > 0) && <li><a href="#pros-cons" className="hover:text-brand">Плюсы и минусы</a></li>}
                {t.tariffs && <li><a href="#tariffs" className="hover:text-brand">Тарифы</a></li>}
                {compareRows.length > 0 && <li><a href="#analogs" className="hover:text-brand">Аналоги</a></li>}
                {t.faq.length > 0 && <li><a href="#faq" className="hover:text-brand">Частые вопросы</a></li>}
              </ol>
            </nav>
          )}

          <article className="prose-site">{md(linkTerms(t.body, { exclude: t.slug, max: 6 }))}</article>
          {/* Одноимённый термин глоссария: там «что это», здесь обзор и цены — ссылки в обе стороны, чтобы страницы не конкурировали */}
          {(() => {
            const n = t.name.toLowerCase();
            const term = getTerms().find((x) => x.term.toLowerCase() === n || x.en.toLowerCase() === n);
            return term ? <p className="mt-6 text-sm text-muted-foreground">Что такое {term.term} простыми словами — <Link href={`/glossary/${term.slug}/`} className="underline underline-offset-4 hover:text-foreground">в глоссарии</Link>.</p> : null;
          })()}

          <LeadMagnet kind={magnetFor(t.category)} className="my-10" />
          {/* 6. Плюсы и минусы */}
          {(t.pros.length > 0 || t.cons.length > 0) && (
            <div id="pros-cons" className="mt-10 grid scroll-mt-20 gap-4 sm:grid-cols-2">
              {t.pros.length > 0 && (
                <div className="rounded-xl border p-5">
                  <h2 className="font-semibold">Плюсы</h2>
                  <ul className="mt-3 space-y-2 text-sm">{t.pros.map((x) => <li key={x} className="flex gap-2"><Plus className="mt-0.5 size-4 shrink-0 text-emerald-600" /><span className="prose-site [&_p]:m-0">{md(x)}</span></li>)}</ul>
                </div>
              )}
              {t.cons.length > 0 && (
                <div className="rounded-xl border p-5">
                  <h2 className="font-semibold">Минусы</h2>
                  <ul className="mt-3 space-y-2 text-sm">{t.cons.map((x) => <li key={x} className="flex gap-2"><Minus className="mt-0.5 size-4 shrink-0 text-red-600" /><span className="prose-site [&_p]:m-0">{md(x)}</span></li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* 8. Тарифы */}
          {t.tariffs && (
            <div id="tariffs" className="mt-10 scroll-mt-20">
              <h2 className="text-lg font-semibold">Тарифы {t.name}</h2>
              <div className="prose-site mt-3 overflow-x-auto text-sm">{md(t.tariffs)}</div>
              {t.card.checked && <p className="mt-2 text-xs text-muted-foreground">Цены на {fmtDate(t.card.checked)}. Перед оплатой проверьте на сайте сервиса.</p>}
            </div>
          )}

          {facts.length > 0 && (
            <dl className="mt-10 divide-y rounded-lg border">
              {facts.map((f) => (
                <div key={f.label} className="grid gap-1 p-4 sm:grid-cols-[170px_1fr] sm:gap-4">
                  <dt className="text-sm font-medium">{f.label}</dt>
                  <dd className="prose-site text-sm text-muted-foreground">{md(f.value)}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* 12. Чем заменить в России */}
          {replacements.length > 0 && (
            <div className="mt-10 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h2 className="font-semibold">Чем заменить {t.name} в России</h2>
              <p className="mt-1 text-sm text-muted-foreground">Аналоги, которые работают без VPN и зарубежной карты:</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">{replacements.map((a) => <li key={a.slug}><ToolLink t={a} /></li>)}</ul>
            </div>
          )}

          {/* 10. Сравнение с аналогами */}
          {compareRows.length > 0 && (
            <div id="analogs" className="mt-12 scroll-mt-20">
              <h2 className="text-lg font-semibold">{t.name} и аналоги</h2>
              <div className="mt-3 overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-card text-xs text-muted-foreground"><tr><th className="p-3 font-medium">Инструмент</th><th className="p-3 font-medium">Цена</th><th className="p-3 font-medium">Россия</th><th className="p-3 font-medium">Бесплатно</th></tr></thead>
                  <tbody className="divide-y">
                    {[t, ...compareRows].map((x) => (
                      <tr key={x.slug} className={x.slug === t.slug ? "bg-brand-bg/50" : undefined}>
                        <td className="p-3 align-top">{x.slug === t.slug ? <span className="inline-flex items-center gap-2 font-medium"><ToolMark t={x} size="sm" />{x.name}</span> : <ToolLink t={x} />}</td>
                        <td className="p-3 align-top text-muted-foreground">{shortPrice(x) || "—"}</td>
                        <td className="p-3 align-top">{x.card.russia ? <RussiaBadge status={x.card.russia} /> : <span className="text-muted-foreground">—</span>}</td>
                        <td className="p-3 align-top text-muted-foreground">{x.card.free ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pairs.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {pairs.map((x) => { const other = x.a.slug === t.slug ? x.b : x.a; return <Link key={x.slug} href={`/tools/compare/${x.slug}/`} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm hover:bg-accent">{t.name} или {other.name}? <ArrowRight className="size-3.5" /></Link>; })}
                </div>
              )}
              {analogs.length > compareRows.length && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {analogs.slice(compareRows.length).map((a) => <Link key={a.slug} href={`/tools/${a.slug}/`} className="rounded-full border px-3 py-1 text-sm hover:bg-accent">{a.name}</Link>)}
                </div>
              )}
            </div>
          )}

          {/* 14. С чем используют вместе */}
          {together.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold">С чем используют вместе</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {together.map((x) => <li key={x.slug} className="rounded-xl border p-4"><ToolLink t={x} /><p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{x.short}</p></li>)}
              </ul>
            </div>
          )}

          {/* 7. Частые вопросы */}
          {t.faq.length > 0 && (
            <div id="faq" className="mt-12 scroll-mt-20">
              <h2 className="text-lg font-semibold">Частые вопросы о {t.name}</h2>
              <div className="mt-3 divide-y border-y">
                {t.faq.map((f) => (
                  <details key={f.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">{f.q}<span className="text-muted-foreground transition-transform group-open:rotate-45">+</span></summary>
                    <div className="prose-site mt-3 text-muted-foreground">{md(f.a)}</div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* 16. Призыв к услуге по теме */}
          <div className="mt-12 flex flex-col gap-4 rounded-xl border border-brand/40 bg-brand-bg p-5 sm:flex-row sm:items-center">
            <div className="flex-1"><p className="font-semibold">{cta.title}</p><p className="mt-1 text-sm text-muted-foreground">{cta.text}</p></div>
            <Button asChild className="shrink-0"><Link href={cta.href}>{cta.label} <ArrowRight /></Link></Button>
          </div>

          {/* 13. Свои материалы: статьи и бесплатные продукты */}
          {(posts.length > 0 || freebies.length > 0) && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {posts.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold">Статьи по теме</h2>
                  <ul className="space-y-2 text-sm">{posts.map((post) => <li key={post.slug}><Link href={`/blog/${post.slug}/`} className="hover:text-brand">{post.title}</Link></li>)}</ul>
                </div>
              )}
              {collections.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold">Подборки по теме</h2>
                  <ul className="space-y-2 text-sm">{collections.map((c) => <li key={c.href}><Link href={c.href} className="hover:text-brand">{c.title}</Link><span className="text-muted-foreground"> — {c.text}</span></li>)}</ul>
                </div>
              )}
              <div>
                <h2 className="mb-3 text-sm font-semibold">Бесплатные инструменты на сайте</h2>
                <ul className="space-y-2 text-sm">{freebies.map((f) => <li key={f.href}><Link href={f.href} className="hover:text-brand">{f.title}</Link><span className="text-muted-foreground"> — {f.text}</span></li>)}</ul>
              </div>
            </div>
          )}

          {sameCat.length > 0 && (
            <div className="mt-10 border-t pt-8">
              <h2 className="mb-3 text-lg font-semibold">Ещё в разделе «{t.subcategory}»</h2>
              <ul className="grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                {sameCat.map((x) => <li key={x.slug}><Link href={`/tools/${x.slug}/`} className="hover:text-foreground">{x.name}</Link></li>)}
              </ul>
              <p className="mt-4 text-sm">{sub ? <Link href={`/tools/c/${sub.slug}/`} className="underline underline-offset-4">Все: {sub.name} →</Link> : <Link href="/tools/" className="underline underline-offset-4">Все инструменты →</Link>}</p>
            </div>
          )}

          {/* 17. Подписка */}
          <a href="https://t.me/nikitaalimpiev" target="_blank" rel="noopener" className="mt-10 flex items-center gap-3 rounded-xl border p-4 text-sm hover:bg-accent">
            <Send className="size-5 shrink-0 text-brand" />
            <span className="flex-1"><span className="font-medium">Подборки инструментов в Telegram</span><span className="block text-muted-foreground">Новые сервисы, аналоги и что работает из России — раз в неделю.</span></span>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </a>
        </Container>
      </Section>

      {/* 4. Кнопка «Перейти» закреплена внизу на телефоне */}
      {t.href && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 p-3 backdrop-blur sm:hidden">
          <a href={t.href} target="_blank" rel={t.isRef ? "sponsored nofollow noopener" : "noopener"} className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground">
            Перейти на {t.siteLabel || "сайт"} <ArrowUpRight className="size-4" />
          </a>
        </div>
      )}
      <div className="pb-16 sm:pb-0"><Cta /></div>
    </>
  );
}
