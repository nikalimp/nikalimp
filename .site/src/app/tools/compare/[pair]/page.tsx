import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight } from "lucide-react";
import { getComparePairs, type Tool } from "@/lib/tools";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { RussiaBadge, ToolMark, shortPrice } from "@/components/tool-parts";
import { breadcrumbs, graph } from "@/lib/schema";

// «X vs Y»: собирается из двух расширенных карточек, когда один инструмент — аналог другого
const RUSSIA_SHORT = { ok: "работает без ограничений", vpn: "открывается только через VPN", card: "работает, но оплатить можно только зарубежной картой", "vpn-card": "доступен только с VPN и зарубежной картой", blocked: "не работает" } as const;

export function generateStaticParams() {
  const pairs = getComparePairs().map((x) => ({ pair: x.slug }));
  return pairs.length ? pairs : [{ pair: "none" }]; // статический экспорт требует хотя бы один адрес; «none» отдаёт 404
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const x = getComparePairs().find((v) => v.slug === pair);
  if (!x) return {};
  const full = `${x.a.name} или ${x.b.name}: что выбрать`;
  const title = full.length < 30 ? `${full} в 2026 году` : full.length <= 52 ? full : `${x.a.name} или ${x.b.name}`;
  const description = `${x.a.name} и ${x.b.name}: сравнение цен, тарифов, работы из России, плюсов и минусов. Кому подходит каждый сервис и что выбрать в 2026 году.`.slice(0, 160);
  return { title, description, alternates: { canonical: `/tools/compare/${x.slug}/` } };
}

const md = (s: string) => <Markdown remarkPlugins={[remarkGfm]}>{s}</Markdown>;

function Col({ t }: { t: Tool }) {
  return (
    <div className="rounded-xl border p-5">
      <Link href={`/tools/${t.slug}/`} className="flex items-center gap-3 hover:text-brand"><ToolMark t={t} size="sm" /><span className="text-lg font-semibold">{t.name}</span></Link>
      <p className="mt-3 text-sm text-muted-foreground">{t.short}</p>
      {t.verdict.forWhom && <p className="mt-4 text-sm"><span className="font-medium">Кому подходит:</span> {t.verdict.forWhom.charAt(0).toUpperCase() + t.verdict.forWhom.slice(1)}</p>}
      {t.verdict.notFor && <p className="mt-2 text-sm"><span className="font-medium">Кому не подходит:</span> {t.verdict.notFor.charAt(0).toUpperCase() + t.verdict.notFor.slice(1)}</p>}
      {t.pros.length > 0 && <><p className="mt-4 text-sm font-medium">Плюсы</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{t.pros.map((p) => <li key={p}>{p.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")}</li>)}</ul></>}
      {t.cons.length > 0 && <><p className="mt-4 text-sm font-medium">Минусы</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{t.cons.map((p) => <li key={p}>{p.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")}</li>)}</ul></>}
      {t.tariffs && <><p className="mt-4 text-sm font-medium">Тарифы</p><div className="prose-site mt-1 overflow-x-auto text-xs">{md(t.tariffs)}</div></>}
      {t.href && <a href={t.href} target="_blank" rel={t.isRef ? "sponsored nofollow noopener" : "noopener"} className="mt-4 inline-flex items-center gap-1 text-sm text-brand hover:underline">{t.siteLabel || "Сайт"} <ArrowUpRight className="size-3.5" /></a>}
    </div>
  );
}

export default async function ComparePage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const x = getComparePairs().find((v) => v.slug === pair);
  if (!x) notFound();
  const { a, b } = x;
  const p = `/tools/compare/${x.slug}/`;
  const rows: [string, (t: Tool) => React.ReactNode][] = [
    ["Цена", (t) => shortPrice(t) || "—"],
    ["Бесплатный план", (t) => t.card.free ?? "—"],
    ["Работа из России", (t) => (t.card.russia ? <RussiaBadge status={t.card.russia} /> : "—")],
    ["Русский язык", (t) => t.card.ruLang ?? "—"],
    ["Платформы", (t) => t.card.platforms.join(", ") || "—"],
    ["Итог", (t) => (t.verdict.summary ? t.verdict.summary.charAt(0).toUpperCase() + t.verdict.summary.slice(1) : "—")],
  ];
  const answer = [
    `${a.name} и ${b.name} — ${a.subcategory === b.subcategory ? `сервисы одной категории «${a.subcategory}»` : "соседние по задачам сервисы"}.`,
    a.verdict.forWhom && `${a.name} — ${a.verdict.forWhom.replace(/^.(?=[а-яёa-z])/, (c) => c.toLowerCase())}`,
    b.verdict.forWhom && `${b.name} — ${b.verdict.forWhom.replace(/^.(?=[а-яёa-z])/, (c) => c.toLowerCase())}`,
    a.card.russia && b.card.russia && a.card.russia !== b.card.russia && `Из России ${a.name} ${RUSSIA_SHORT[a.card.russia]}, а ${b.name} ${RUSSIA_SHORT[b.card.russia]}.`,
  ].filter(Boolean).join(" ");
  return (
    <>
      <JsonLd data={graph(breadcrumbs([{ name: "Главная", path: "/" }, { name: "Инструменты", path: "/tools/" }, { name: `${a.name} или ${b.name}`, path: p }]))} />
      <Section className="pt-12">
        <Container className="max-w-4xl">
          <nav className="mb-6 text-center text-sm text-muted-foreground"><Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/tools/" className="hover:text-foreground">Инструменты</Link></nav>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{a.name} или {b.name}: что выбрать</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">{answer}</p>
          <div className="mt-10 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-card"><tr><th className="p-3" /><th className="p-3 font-semibold">{a.name}</th><th className="p-3 font-semibold">{b.name}</th></tr></thead>
              <tbody className="divide-y">{rows.map(([label, f]) => <tr key={label}><th scope="row" className="p-3 text-left align-top font-medium text-muted-foreground">{label}</th><td className="p-3 align-top">{f(a)}</td><td className="p-3 align-top">{f(b)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2"><Col t={a} /><Col t={b} /></div>
          <p className="mt-8 text-center text-sm text-muted-foreground">Подробно — на страницах <Link href={`/tools/${a.slug}/`} className="text-brand hover:underline">{a.name}</Link> и <Link href={`/tools/${b.slug}/`} className="text-brand hover:underline">{b.name}</Link>.</p>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
