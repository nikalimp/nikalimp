import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { anatomy, findGalleryCategory, getGalleryBase, getGallerySite, getGallerySites, host, NICHE_FOR, NICHE_TIPS, similarGallerySites, siteFaq, sourceOf, galleryCatPath } from "@/lib/sites";
import { services } from "@/lib/services";
import { site } from "@/lib/site";
import { metaDesc, metaTitle } from "@/lib/utils";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { SiteCard, grid } from "@/components/site-parts";
import { SiteLead } from "@/components/site-lead";
import { breadcrumbs, faqSchema, graph } from "@/lib/schema";

// Страница примера: под запросы «<название> сайт», «на чём сделан <домен>», «сайт <ниши> на тильде пример»
export function generateStaticParams() {
  const all = getGallerySites();
  return all.length ? all.map((i) => ({ slug: i.s })) : [{ slug: "none" }];
}

// title не короче 40 знаков вместе с « — NikAlimp» (стандарт §3): коротким названиям добавляем нишу
const pageTitle = (n: string, niche: string) => {
  const t = `${n} — пример дизайна сайта`;
  return t.length + " — NikAlimp".length >= 40 ? t : `Сайт ${n}: пример дизайна, ${niche.toLowerCase()}`;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const it = getGallerySite((await params).slug);
  if (!it) return {};
  const niche = getGalleryBase().niches[it.k];
  return {
    title: metaTitle(pageTitle(it.n, niche)),
    description: metaDesc(`Сайт ${it.n} (${host(it.u)}) в коллекции примеров NikAlimp, ниша «${niche.toLowerCase()}». Скриншот главной, разбор структуры и что взять для своего сайта.`),
    alternates: { canonical: `/sites/${it.s}/` },
    openGraph: { type: "article", title: pageTitle(it.n, niche), images: [{ url: it.img }] },
  };
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const it = getGallerySite((await params).slug);
  if (!it) notFound();
  const b = getGalleryBase();
  const cat = findGalleryCategory(it.c)!;
  const sub = findGalleryCategory(`${it.c}/${it.k}`);
  const niche = b.niches[it.k];
  const url = `/sites/${it.s}/`;
  const personal = it.c === "personal" || it.c === "portfolio";
  const svc = services.find((s) => s.slug === (personal ? "personal-website" : "corporate-website"));
  const upgrade = services.find((s) => s.slug === "corporate-website")?.prices.find((p) => /Апгрейд/.test(p.name))?.value ?? "от 40 000 ₽";
  const faq = siteFaq(it);
  const src = sourceOf(it);
  const similar = similarGallerySites(it);
  const facts: [string, React.ReactNode][] = [
    ["Сайт", <a key="u" href={it.u} target="_blank" rel="nofollow noopener" className="inline-flex items-center gap-1 text-brand hover:underline">{host(it.u)}<ArrowUpRight className="size-3.5" /></a>],
    ["Категория", <Link key="c" href={galleryCatPath(cat)} className="text-brand hover:underline">{cat.name}</Link>],
    ["Ниша", sub ? <Link key="k" href={galleryCatPath(sub)} className="text-brand hover:underline">{niche}</Link> : niche],
    ["Источник", <a key="src" href={src.url} target="_blank" rel="nofollow noopener" className="text-brand hover:underline">{src.name}</a>],
    ...(it.rc ? [["Главная", `${it.rc} блоков${it.z ? `, из них вручную — ${it.z}` : ""}`] as [string, React.ReactNode]] : []),
  ];
  return (
    <>
      <JsonLd data={graph(
        { "@type": "CreativeWork", name: it.n, headline: pageTitle(it.n, niche), description: it.ds ?? it.t, url: `${site.url}${url}`, sameAs: it.u, image: it.img, genre: niche, inLanguage: "ru-RU" },
        faqSchema(faq),
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "Примеры сайтов", path: "/sites/" }, { name: cat.name, path: galleryCatPath(cat) }, ...(sub ? [{ name: sub.name, path: galleryCatPath(sub) }] : []), { name: it.n, path: url }]),
      )} />
      <Section className="pt-12">
        <Container className="max-w-5xl">
          <nav aria-label="Хлебные крошки" className="mb-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/sites/" className="hover:text-foreground">Примеры сайтов</Link> / <Link href={galleryCatPath(cat)} className="hover:text-foreground">{cat.name}</Link>
            {sub && <> / <Link href={galleryCatPath(sub)} className="hover:text-foreground">{sub.name}</Link></>}
          </nav>
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{it.n}</h1>
              {it.t && <p className="mt-2 text-lg text-muted-foreground">{it.t}</p>}
              <a href={it.u} target="_blank" rel="nofollow noopener" className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90">
                Открыть сайт<ArrowUpRight className="size-4" />
              </a>
              <dl className="mt-8 grid gap-3 rounded-xl border bg-card p-5 text-sm">
                {facts.map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
                    <dd className="min-w-0 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {/* Длинный скриншот главной: листается внутри рамки */}
            <figure className="overflow-hidden rounded-xl border bg-muted">
              <div className="flex h-7 items-center gap-1.5 border-b bg-card px-3" aria-hidden><span className="size-2.5 rounded-full bg-muted-foreground/30" /><span className="size-2.5 rounded-full bg-muted-foreground/30" /><span className="size-2.5 rounded-full bg-muted-foreground/30" /><span className="ml-2 truncate font-mono text-[11px] text-muted-foreground">{host(it.u)}</span></div>
              <div className="max-h-[560px] overflow-y-auto" tabIndex={0} aria-label={`Скриншот главной страницы ${it.n}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.big} alt={`Главная страница сайта ${it.n} — скриншот`} width={900} className="w-full" />
              </div>
              <figcaption className="border-t bg-card px-3 py-2 text-xs text-muted-foreground">Скриншот главной страницы. Листайте внутри рамки.</figcaption>
            </figure>
          </div>
        </Container>
        <Container className="mt-12 max-w-3xl">
          <article className="prose-site">
            <h2>О проекте</h2>
            <p>{it.n} — {it.ds ? <>проект в нише «{niche.toLowerCase()}». Как он описывает себя: «{it.ds.replace(/[.\s]+$/, "")}».</> : <>сайт в нише «{niche.toLowerCase()}»{it.t ? `: ${it.t.charAt(0).toLowerCase()}${it.t.slice(1)}` : ""}.</>} В коллекции он в разделе «{cat.name}».</p>
            {anatomy(it).length > 0 && <h2>Как устроен сайт</h2>}
            {anatomy(it).map((p) => <p key={p}>{p}</p>)}
            <h2>Что взять для своего сайта</h2>
            <p>Если делаете сайт для {NICHE_FOR[it.k]}, вот что стоит проверить на этом примере и у себя:</p>
            <ul>{(NICHE_TIPS[it.k] ?? NICHE_TIPS.other).map((t) => <li key={t}>{t}</li>)}</ul>
          </article>
          <SiteLead name={it.n} url={it.u} personal={personal} price={svc?.prices[0]?.value ?? ""} upgrade={upgrade} className="mt-10" />
          <h2 className="mt-14 text-2xl font-semibold tracking-tight">Частые вопросы</h2>
          <div className="mt-4 divide-y rounded-xl border">
            {faq.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
        {similar.length > 0 && (
          <Container className="mt-16">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Похожие сайты</h2>
            <ul className={`mt-6 ${grid}`}>{similar.map((s) => <SiteCard key={s.s} it={s} niches={b.niches} />)}</ul>
            <p className="mt-6 text-center text-sm"><Link href={galleryCatPath(sub ?? cat)} className="text-brand hover:underline">Все сайты: {sub ? `${cat.name} → ${sub.name}` : cat.name} →</Link></p>
          </Container>
        )}
      </Section>
      <Cta />
    </>
  );
}
