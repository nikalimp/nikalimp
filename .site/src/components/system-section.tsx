import { ArrowDown, ArrowRight, Bot, Check, FileCheck2, GitPullRequest, MessagesSquare, Search, Sparkles, Users } from "lucide-react";
import { Container, Eyebrow, Section } from "@/components/container";
import { system, totalSkills } from "@/lib/system";

/** Главная: как устроена агентная система — вход, плагины, инструменты и стандарты, публикация, три аудитории сайта. */
const inputs = ["Сайт или лендинг", "Веб-сервис, админка", "GEO-аудит", "Блог проекта"];
const standards = ["AI-Ready сайт", "Веб-сервис", "Публикация через Git", "152-ФЗ и юрисдикция"];
const ship = ["Ветка и запрос на слияние", "Автопроверка: сборка, тексты, GEO", "Слияние и выкладка", "Проверка живого сайта"];
const outputs = [
  { icon: Users, title: "Люди", text: "Находят сайт в Яндексе и Google, читают ответ в первом абзаце." },
  { icon: Sparkles, title: "Нейросети", text: "Алиса, GigaChat, ChatGPT и Perplexity цитируют факты сайта в ответах." },
  { icon: Bot, title: "ИИ-агенты", text: "Через MCP и WebMCP узнают цены и оставляют заявку сами, без перехода на сайт." },
];

function Flow({ vertical = false }: { vertical?: boolean }) {
  const Icon = vertical ? ArrowDown : ArrowRight;
  return <span aria-hidden="true" className={vertical ? "flex justify-center py-2 text-brand lg:hidden" : "hidden items-center justify-center text-brand lg:flex"}><Icon className="size-5" /></span>;
}

export function SystemSection() {
  return (
    <Section className="border-t">
      <Container>
        <Eyebrow>Как я работаю с ИИ</Eyebrow>
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">Агентная система: {totalSkills} скиллов, {system.tools} инструментов и единые стандарты</h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Каждый шаг работы описан как скилл — инструкция для ИИ-агента — и проверяется одинаково на любом проекте. Поэтому сайт выходит за недели, а качество не зависит от того, устал ли исполнитель.
        </p>

        <div className="mt-10 grid items-stretch gap-0 lg:grid-cols-[1fr_auto_2.2fr_auto_1fr] lg:gap-4">
          {/* Вход */}
          <div className="card rounded-xl border p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Задача</p>
            <ul className="mt-3 space-y-2 text-sm">
              {inputs.map((t) => <li key={t} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-brand" />{t}</li>)}
            </ul>
            <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">Первый вопрос: тип, языки, юрисдикция, концепция дизайна.</p>
          </div>
          <Flow /><Flow vertical />

          {/* Система */}
          <div className="rounded-xl border border-brand/40 bg-brand-bg p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-brand">Агентная система</p>
            <ul className="mt-3 grid gap-3">
              {system.plugins.map((p) => (
                <li key={p.id} className="flex items-start gap-4 rounded-lg border bg-background p-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2"><span className="font-semibold">{p.title}</span><span className="font-mono text-xs text-brand">/{p.id}</span></p>
                    <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
                  </div>
                  <p className="shrink-0 text-right text-xs text-muted-foreground"><span className="block font-mono text-2xl font-semibold text-foreground tabular-nums">{p.skills}</span>скиллов</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <p className="flex items-center gap-2 font-semibold"><FileCheck2 className="size-4 text-brand" />{system.tools} инструментов</p>
                <p className="mt-2 text-sm text-muted-foreground">Главред и Типограф для текстов, GEO-проверка сайта, замер ответов нейросетей, выкладка на хостинг.</p>
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="flex items-center gap-2 font-semibold"><Search className="size-4 text-brand" />Стандарты</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {standards.map((s) => <li key={s} className="rounded-full border px-2.5 py-0.5 text-xs">{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
          <Flow /><Flow vertical />

          {/* Выход */}
          <div className="grid gap-3">
            {outputs.map((o) => (
              <div key={o.title} className="card rounded-xl border p-4">
                <p className="flex items-center gap-2 font-semibold"><o.icon className="size-4 text-brand" />{o.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{o.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Публикация */}
        <div className="mt-6 rounded-xl border p-5">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground"><GitPullRequest className="size-4 text-brand" />Каждое изменение — через Git</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ship.map((s, i) => (
              <li key={s} className="flex items-start gap-3">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-bg font-mono text-xs text-brand">{i + 1}</span>
                <span className="text-sm">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-start gap-2 border-t pt-3 text-sm text-muted-foreground"><MessagesSquare className="mt-0.5 size-4 shrink-0 text-brand" />По расписанию: статья в блог по будням, отчёт по поиску и нейросетям по пятницам, замер видимости в нейросетях раз в месяц.</p>
        </div>
      </Container>
    </Section>
  );
}
