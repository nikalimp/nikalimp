import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { AuditTool } from "@/components/audit-tool";
import { faqSchema, graph } from "@/lib/schema";
import type { Mode } from "@/lib/audit";

type Props = { mode: Mode; path: string; h1: string; lead: string; checks: { title: string; text: string }[]; how: string[]; faq: { q: string; a: string }[] };

/** Общий шаблон страниц бесплатных аудитов: инструмент сверху, ниже — что проверяем, как пользоваться и FAQ. */
export function AuditPage({ mode, path, h1, lead, checks, how, faq }: Props) {
  return (
    <>
      <JsonLd data={graph(
        { "@type": "WebApplication", name: h1, url: `${site.url}${path}`, applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "ru-RU", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" }, author: { "@type": "Person", name: site.person } },
        faqSchema(faq),
      )} />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">{h1}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground print:hidden">{lead}</p>
          <div className="mx-auto mt-10 max-w-4xl"><AuditTool mode={mode} /></div>
        </Container>
      </Section>
      <Section className="border-t bg-card print:hidden">
        <Container className="max-w-4xl">
          <h2 className="text-2xl font-semibold tracking-tight">Что проверяем</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {checks.map((c) => (
              <div key={c.title} className="rounded-xl border bg-background p-5">
                <p className="font-semibold">{c.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.text}</p>
              </div>
            ))}
          </div>
          <h2 className="mt-14 text-2xl font-semibold tracking-tight">Как пользоваться отчётом</h2>
          <ol className="mt-4 space-y-3">
            {how.map((t, i) => <li key={i} className="flex gap-3"><span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-bg text-sm font-semibold text-brand">{i + 1}</span><span className="pt-0.5 text-muted-foreground">{t}</span></li>)}
          </ol>
          <h2 className="mt-14 text-2xl font-semibold tracking-tight">Частые вопросы</h2>
          <div className="mt-4 divide-y rounded-xl border bg-background">
            {faq.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>
      <div className="print:hidden"><Cta /></div>
    </>
  );
}
