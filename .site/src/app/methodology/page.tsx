import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { site } from "@/lib/site";
import { methodAnswer, methodFaq, methodLimits, methodPath, methodReport, methodSteps, methodTitle } from "@/lib/method";
import { Container, Eyebrow, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, faqSchema, graph, personId } from "@/lib/schema";
import { metaDesc } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Как измерить видимость бизнеса в нейросетях: методика",
  description: "Видимость в нейросетях — доля ответов, где нейросеть называет ваш бизнес. Как я её считаю, какие нейросети проверяю и что входит в отчёт.",
  alternates: { canonical: methodPath },
  openGraph: { title: methodTitle, url: `${site.url}${methodPath}` },
};

export default function MethodPage() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "Article", headline: methodTitle, description: methodAnswer, url: `${site.url}${methodPath}`, author: { "@id": personId }, inLanguage: "ru" },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Методика замеров", path: methodPath }]),
          faqSchema(methodFaq),
        )}
      />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <Eyebrow className="text-center">Методика</Eyebrow>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl text-center mx-auto max-w-3xl">{methodTitle}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-center mx-auto max-w-2xl">{methodAnswer}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4 justify-center">
            <Button asChild size="lg"><Link href="/geo-audit/">Узнать свою долю</Link></Button>
            <Link href="/geo-audit/" className="text-sm text-brand hover:underline">Тарифы продвижения в нейросетях →</Link>
          </div>
        </Container>
      </Section>

      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <Eyebrow>Как считаю</Eyebrow>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">Шесть шагов замера</h2>
          <ol className="space-y-6">
            {methodSteps.map((m, i) => (
              <li key={m.title} className="flex gap-4">
                <span className="font-mono text-sm text-brand">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-medium">{m.title}</h3>
                  <p className="mt-1 text-muted-foreground">{m.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-xl border bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Формула</p>
            <p className="mt-3 text-lg font-medium">Доля упоминаний = ответы с вашим упоминанием ÷ все ответы × 100%</p>
          </div>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Отчёт</Eyebrow>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">Что в ежемесячном отчёте</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {methodReport.map((r) => (
              <div key={r.title} className="rounded-xl border p-5">
                <h3 className="font-medium">{r.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <Eyebrow>Ограничения</Eyebrow>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Чего метрика не показывает</h2>
          <ul className="space-y-3">
            {methodLimits.map((l) => (
              <li key={l} className="flex gap-3"><Info className="mt-0.5 size-4 shrink-0 text-brand" />{l}</li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Вопросы</Eyebrow>
          <div className="space-y-6">
            {methodFaq.map((f) => (
              <div key={f.q}>
                <h2 className="font-medium">{f.q}</h2>
                <p className="mt-1.5 text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Cta />
    </>
  );
}
