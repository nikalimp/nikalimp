import { metaTitle } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ShieldCheck, X } from "lucide-react";
import { serviceBySlug, services } from "@/lib/services";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { ServiceCard } from "@/components/service-card";
import { ExpressBand, GeoFit, GeoHowAiChooses, GeoSourcesByAi, GeoWorkGrid } from "@/components/geo-sections";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, faqSchema, graph, orgId } from "@/lib/schema";
import { termsIn } from "@/lib/glossary";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  if (!s) return {};
  return {
    title: metaTitle(s.metaTitle),
    description: s.metaDescription,
    alternates: { canonical: `/services/${s.slug}/` },
    openGraph: { title: s.metaTitle, description: s.metaDescription, url: `${site.url}/services/${s.slug}/` },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = serviceBySlug(slug);
  if (!s) notFound();
  const path = `/services/${s.slug}/`;
  const terms = termsIn([s.h1, s.answer, ...s.forWhom, ...s.includes.map((i) => `${i.title}. ${i.text}`), ...s.process.map((p) => `${p.title}. ${p.text}`), ...s.faq.map((f) => `${f.q} ${f.a}`)].join("\n"));
  const geo = s.slug === "website-geo";
  const related = s.related.map(serviceBySlug).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const nodes: (Record<string, unknown> | null)[] = [
    {
      "@type": "Service",
      name: s.title,
      serviceType: s.h1,
      description: s.answer,
      url: `${site.url}${path}`,
      provider: { "@id": orgId },
      areaServed: ["RU", "BY", "KZ", "GE"],
      offers: s.prices.map((p) => ({ "@type": "Offer", name: p.name, description: [p.value, p.note].filter(Boolean).join(". "), priceCurrency: "RUB" })),
    },
    breadcrumbs([{ name: "Главная", path: "/" }, { name: "Услуги", path: "/services/" }, { name: s.title, path }]),
  ];
  if (s.faq.length) nodes.push(faqSchema(s.faq));

  return (
    <>
      <JsonLd data={graph(...nodes)} />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <nav className="mb-6 text-sm text-muted-foreground text-center">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/services/" className="hover:text-foreground">Услуги</Link> / {s.title}
          </nav>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl text-center mx-auto max-w-3xl">{s.h1}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-center mx-auto max-w-2xl">{s.answer}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4 justify-center">
            <Button asChild size="lg"><a href={site.booking} target="_blank" rel="noopener">Записаться на консультацию</a></Button>
            <p className="text-sm text-muted-foreground">30 минут, Zoom · {s.prices[0].value}</p>
          </div>
        </Container>
      </Section>

      {geo ? (
        <>
          <GeoHowAiChooses />
          <ExpressBand />
          <GeoFit notFor={s.notFor} />
          <GeoWorkGrid title="Как работает продвижение в нейросетях: шесть связанных действий" items={s.includes} />
          <GeoSourcesByAi />
        </>
      ) : (
        <>
      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <Eyebrow>Кому подходит</Eyebrow>
          <ul className="space-y-3">
            {s.forWhom.map((f) => (
              <li key={f} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{f}</li>
            ))}
          </ul>
          {s.notFor && (
            <>
              <Eyebrow className="mt-10">Кому не подойдёт</Eyebrow>
              <ul className="space-y-3">
                {s.notFor.map((f) => (
                  <li key={f} className="flex gap-3 text-muted-foreground"><X className="mt-0.5 size-4 shrink-0" />{f}</li>
                ))}
              </ul>
            </>
          )}
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Что входит</Eyebrow>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">Что входит в услугу</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {s.includes.map((i) => (
              <div key={i.title}>
                <h3 className="font-medium">{i.title}</h3>
                <p className="mt-1.5 text-muted-foreground">{i.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

        </>
      )}

      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <Eyebrow>Как работаем</Eyebrow>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">Этапы работы</h2>
          <ol className="space-y-6">
            {s.process.map((p, i) => (
              <li key={p.title} className="flex gap-4">
                <span className="font-mono text-sm text-brand">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="mt-1 text-muted-foreground">{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
          {s.roadmap && (
            <>
              <h2 className="mb-6 mt-14 text-2xl font-semibold tracking-tight">Что вы увидите по месяцам</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {s.roadmap.map((r) => (
                  <div key={r.period} className="rounded-xl border bg-background p-5">
                    <p className="font-mono text-xs uppercase tracking-wider text-brand">{r.period}</p>
                    <h3 className="mt-2 font-medium">{r.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {(s.slug === "personal-website" || s.slug === "corporate-website") && (
            <Link href="/#process" className="mt-8 inline-flex text-sm text-brand hover:underline">Подробно: что происходит на каждом этапе и что нужно от вас →</Link>
          )}
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Стоимость</Eyebrow>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">Сколько стоит</h2>
          <div className="divide-y rounded-xl border">
            {s.prices.map((p) => (
              <div key={p.name} className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.note && <p className="text-sm text-muted-foreground">{p.note}</p>}
                  {p.limits && (
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {p.limits.map((l) => (
                        <li key={l} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-brand" />{l}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="font-semibold tabular-nums sm:self-start">{p.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{s.timeline}</p>
          {s.slug === "website-geo" && (
            <Link href="/methodology/" className="mt-3 inline-flex text-sm text-brand hover:underline">Как я измеряю видимость в нейросетях и что будет в отчёте →</Link>
          )}
          {s.guarantee && (
            <div className="mt-8 flex flex-col gap-4 rounded-xl border border-brand/40 bg-brand-bg p-6 sm:flex-row sm:items-start">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-brand"><ShieldCheck className="size-5" /></span>
              <div>
                <p className="text-lg font-semibold">{s.guarantee.title}</p>
                <p className="mt-2 text-muted-foreground">{s.guarantee.text}</p>
              </div>
            </div>
          )}
        </Container>
      </Section>

      {s.faq.length > 0 && (
        <Section className="border-t bg-card">
          <Container className="max-w-3xl">
            <Eyebrow>Вопросы</Eyebrow>
            <h2 className="mb-8 text-2xl font-semibold tracking-tight">Частые вопросы</h2>
            <div className="space-y-6">
              {s.faq.map((f) => (
                <div key={f.q}>
                  <h3 className="font-medium">{f.q}</h3>
                  <p className="mt-1.5 text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {terms.length > 0 && (
        <Section className={s.faq.length > 0 ? "border-t" : "border-t bg-card"}>
          <Container className="max-w-3xl">
            <Eyebrow>Глоссарий</Eyebrow>
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">Термины по теме</h2>
            <div className="flex flex-wrap gap-2">
              {terms.map((t) => (
                <Link key={t.slug} href={`/glossary/${t.slug}/`} className="rounded-full border px-3 py-1 text-sm hover:bg-accent">{t.term}</Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {related.length > 0 && (
        <Section className={terms.length > 0 && s.faq.length > 0 ? "border-t bg-card" : "border-t"}>
          <Container>
            <Eyebrow>Вместе с этим</Eyebrow>
            <h2 className="mb-8 text-2xl font-semibold tracking-tight">Связанные услуги</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <ServiceCard key={r.slug} s={r} />)}
            </div>
          </Container>
        </Section>
      )}

      <Cta />
    </>
  );
}
