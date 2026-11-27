import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Plug } from "lucide-react";
import { getPlugins, PLUGIN_CATEGORIES } from "@/lib/plugins";
import { getAgents } from "@/lib/agents";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { faqSchema, graph } from "@/lib/schema";

const catId = (i: number) => `cat-${i + 1}`;

export const metadata: Metadata = {
  title: "Плагины и MCP для ИИ-агентов: каталог и установка",
  description: "Коллекция плагинов, MCP-серверов и скиллов для Claude Code, Cursor и веб-разработки: подробное описание, команды установки и связь с ИИ-агентами.",
  alternates: { canonical: "/plugins/" },
};

const faq = [
  { q: "Что такое MCP-сервер и плагин для ИИ-агента", a: "MCP (Model Context Protocol) — открытый стандарт, который даёт ИИ-агенту доступ к внешним инструментам: браузеру, Яндекс Метрике, Google Search Console, Todoist или компонентам shadcn/ui. Плагины и скиллы добавляют инструкции и скрипты проверки." },
  { q: "С какими средами работают эти плагины", a: "Большинство MCP-серверов и CLI-инструментов работают в Claude Code, Cursor, Windsurf, BB и GitHub Actions. На странице каждого плагина указаны совместимые среды и точная команда установки." },
  { q: "Работают ли эти инструменты из России", a: "Все локальные CLI-инструменты (Главред, Типограф, Playwright, Deploy Kit) и российские интеграции (Яндекс Вебмастер, Метрика, Telegram) работают напрямую. Для частей с зарубежными API на странице указаны нюансы настройки." },
  { q: "Нужны ли все плагины сразу", a: "Нет. Подключайте только те модули, которые закрывают текущую задачу: для вёрстки хватит shadcn/ui MCP, Playwright и Типографа, а для продвижения — GEO-аудита, Schema.org и Яндекс Вебмастера." },
];

export default function PluginsPage() {
  const plugins = getPlugins();
  const agents = getAgents();
  const agentBySlug = new Map(agents.map((a) => [a.slug, a]));
  const grouped = PLUGIN_CATEGORIES.map((name, i) => ({
    id: catId(i),
    name,
    items: plugins.filter((p) => p.category === name),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "ItemList",
            name: "Плагины и MCP для ИИ-агентов",
            url: `${site.url}/plugins/`,
            numberOfItems: plugins.length,
            itemListElement: plugins.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.name,
              url: `${site.url}/plugins/${p.slug}/`,
            })),
          },
          faqSchema(faq),
        )}
      />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Плагины и MCP для ИИ-агентов</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {plugins.length} проверенных плагинов, MCP-серверов, скиллов и CLI-инструментов, на которых работает команда NikAlimp. У каждого — подробное описание, пошаговая установка и список агентов, которые его используют.
          </p>
          <nav aria-label="Категории плагинов" className="mt-8 flex flex-wrap justify-center gap-2">
            {grouped.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-brand/50 hover:text-brand">
                {g.name} <span className="ml-1 font-mono text-xs text-muted-foreground">{g.items.length}</span>
              </a>
            ))}
            <Link href="/agents/" className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-bg px-4 py-1.5 text-sm font-medium text-brand hover:opacity-90">
              <Bot className="size-3.5" />ИИ-агенты ({agents.length})
            </Link>
          </nav>

          <div className="mt-12 space-y-14">
            {grouped.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-20">
                <div className="flex items-baseline justify-between border-b pb-3">
                  <h2 className="text-2xl font-semibold tracking-tight">{g.name}</h2>
                  <span className="font-mono text-xs text-muted-foreground">{g.items.length}</span>
                </div>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/plugins/${p.slug}/`} className="group flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:border-brand/40">
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center gap-2 font-semibold group-hover:text-brand">
                            <Plug className="size-4 shrink-0 text-brand" />
                            {p.name}
                          </span>
                          <span className="shrink-0 rounded-full border bg-background px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">{p.kind}</span>
                        </div>
                        <p className="mt-2.5 flex-1 text-sm text-muted-foreground">{p.short}</p>
                        {p.agents.length > 0 && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Агенты: {p.agents.map((id) => agentBySlug.get(id)?.emp.name ?? id).join(", ")}
                          </p>
                        )}
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
                          Установка и описание<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
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
      <Cta offer="service" />
    </>
  );
}
