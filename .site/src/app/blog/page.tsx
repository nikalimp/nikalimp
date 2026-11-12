import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getPosts } from "@/lib/posts";
import { Container, Section } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Блог о GEO: как попасть в ответы нейросетей",
  description: "Практика GEO, AEO и SEO: как бизнесу попасть в ответы Алисы AI, ChatGPT, GigaChat и Perplexity. Открытый эксперимент с продвижением nikalimp.ru.",
  alternates: { canonical: "/blog/" },
};

export default function Blog() {
  const posts = getPosts();
  return (
    <>
    <JsonLd data={graph(breadcrumbs([{ name: "Главная", path: "/" }, { name: "Блог", path: "/blog/" }]))} />
    <Section className="pt-12">
      <Container>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">GEO на практике</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground text-center mx-auto">Как бизнесу попасть в ответы нейросетей — и публичный журнал продвижения этого сайта.</p>
        {/* «Открытый эксперимент» — перенесено с главной 27.10.2026 */}
        <div className="mt-8 rounded-xl border border-brand/40 bg-brand-bg p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-brand">Открытый эксперимент</p>
          <p className="mt-2 text-xl font-semibold">Продвигаю этот сайт тем же методом — публично</p>
          <p className="mt-2 max-w-3xl text-muted-foreground">Каждый месяц публикую замеры: по каким запросам нейросети уже называют nikalimp.ru, что сработало и что нет. Без обещаний — только цифры.</p>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground"><span className="font-medium text-foreground">Точка отсчёта, 14 октября 2026:</span> 0 упоминаний в 13 ответах Алисы и ChatGPT (brandfound) и в 4 запросах AIMonitor; технический аудит AIMonitor — 83,9 из 100, Geoptie — 85 из 100. Как считаю — в <Link href="/methodology/" className="underline underline-offset-4">методике</Link>.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}/`} className="card group flex flex-col overflow-hidden rounded-xl border hover:bg-accent">
              {p.cover && <img src={p.cover} alt="" loading="lazy" width={1200} height={630} className="aspect-[40/21] w-full border-b object-cover" />}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm text-muted-foreground">{formatDate(p.date)}{p.rubric && <> · {p.rubric}</>}</p>
                <h2 className="mt-2 text-lg font-semibold leading-snug group-hover:text-brand">{p.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
    </>
  );
}
