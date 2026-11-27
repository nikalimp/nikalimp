import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plug } from "lucide-react";
import { getAgents } from "@/lib/agents";
import { getPlugins } from "@/lib/plugins";
import { officeFloors } from "@/lib/office";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { AgentSprite } from "@/components/agent-sprite";
import { faqSchema, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "ИИ-агенты NikAlimp: 13 ролей от брифа до заявок",
  description: "Как устроена команда ИИ-агентов для разработки, SEO, GEO и контент-завода: описание работы каждого агента, этапы и список плагинов.",
  alternates: { canonical: "/agents/" },
};

const faq = [
  { q: "Чем ИИ-агент отличается от обычного чата с нейросетью", a: "Обычный чат отвечает на разовый запрос и не помнит правил проекта. ИИ-агент работает по фиксированной роли, читает спецификацию, использует подключённые плагины и MCP-серверы, а результат проверяет автоматическими скриптами." },
  { q: "Сколько агентов участвует в создании и поддержке сайта", a: "В архитектуре NikAlimp работают 13 агентов на четырёх этажах: производство сайта, поиск и нейросети (GEO), контент-завод с заявками и операционное управление 24/7." },
  { q: "Какие плагины нужны для запуска таких агентов", a: "Каждый агент опирается на 2⁠–⁠4 инструмента: MCP-серверы (shadcn/ui, Playwright, Google Search Console, Яндекс Метрика, Todoist), CLI-проверки (Главред, Типограф, geo-check) и пайплайны GitHub Actions. Все плагины с инструкциями по установке собраны в коллекции /plugins/." },
  { q: "Можно ли собрать похожую систему агентов под свой бизнес", a: "Да. Мы настраиваем сайты, контент-завод, мониторинг позиций и агентов под задачи компании. Оставьте заявку внизу страницы — разберём процессы и предложим архитектуру." },
];

export default function AgentsPage() {
  const agents = getAgents();
  const plugins = getPlugins();
  const pluginBySlug = new Map(plugins.map((p) => [p.slug, p]));

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "ItemList",
            name: "ИИ-агенты NikAlimp",
            url: `${site.url}/agents/`,
            numberOfItems: agents.length,
            itemListElement: agents.map((a, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: a.emp.name,
              url: `${site.url}/agents/${a.slug}/`,
            })),
          },
          faqSchema(faq),
        )}
      />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">ИИ-агенты команды NikAlimp</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {agents.length} специализированных ИИ-агентов, которые ведут сайты от брифа и дизайн-системы до GEO-замеров, контент-завода и мониторинга 24/7. У каждого — своя зона ответственности и набор подключённых плагинов.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {officeFloors.map((f) => (
              <a key={f.number} href={`#floor-${f.number}`} className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-brand/50 hover:text-brand">
                {f.number} · {f.title}
              </a>
            ))}
            <Link href="/plugins/" className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-bg px-4 py-1.5 text-sm font-medium text-brand hover:opacity-90">
              <Plug className="size-3.5" />Все плагины ({plugins.length})
            </Link>
          </div>

          <div className="mt-12 space-y-14">
            {officeFloors.map((floor) => {
              const items = agents.filter((a) => a.floor.number === floor.number);
              if (!items.length) return null;
              return (
                <section key={floor.number} id={`floor-${floor.number}`} className="scroll-mt-20">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-brand">{floor.number} этаж · {floor.code}</p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{floor.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">{floor.zone}</p>
                  </div>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((a) => (
                      <li key={a.slug}>
                        <Link href={`/agents/${a.slug}/`} className="group flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:border-brand/40">
                          <div className="flex items-start gap-4">
                            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-xl border bg-muted/60 p-2">
                              <AgentSprite emp={a.emp} staticOnly className="w-8" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="block font-semibold group-hover:text-brand">{a.emp.name}</span>
                              <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{a.emp.tool}</span>
                              <span className="mt-1 inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{a.emp.role}</span>
                            </div>
                          </div>
                          <p className="mt-4 flex-1 text-sm text-muted-foreground">{a.emp.speech}</p>
                          {a.plugins.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
                              {a.plugins.map((ps) => {
                                const p = pluginBySlug.get(ps);
                                return (
                                  <span key={ps} className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
                                    {p?.name ?? ps}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
                            Описание и плагины<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">Частые вопросы</h2>
            <div className="mt-4 divide-y rounded-xl border">
              {faq.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="cursor-pointer font-medium">{f.q}</summary>
                  <p className="mt-2 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </Section>
      <Cta offer="site" />
    </>
  );
}
