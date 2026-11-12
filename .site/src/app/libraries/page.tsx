import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { libraries } from "@/lib/products";
import { getStartupsWithPages } from "@/lib/startups";
import { getTools } from "@/lib/tools";
import { getTerms } from "@/lib/glossary";
import { getDesignStyles } from "@/lib/design-styles";
import { getFonts } from "@/lib/fonts";
import { getGallerySites } from "@/lib/sites";
import { getSystems, getUiLibraries } from "@/lib/design-systems";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Библиотеки: стартапы, сервисы и стили дизайна",
  description: "Справочные базы для тех, кто делает сайты и продукты: российские стартапы, сервисы для SEO и веба, глоссарий GEO и SEO и дизайн-направления с примерами.",
  alternates: { canonical: "/libraries/" },
};

export default function LibrariesPage() {
  const count: Record<string, number> = {
    "/startups/": getStartupsWithPages().length, "/sites/": getGallerySites().length, "/tools/": getTools().length, "/glossary/": getTerms().length,
    "/design-styles/": getDesignStyles().length, "/fonts/": getFonts().length,
    "/design-systems/": getSystems().length, "/ui-libraries/": getUiLibraries().length,
  };
  const items = libraries.filter((l) => count[l.href] > 0);
  return (
    <>
      <JsonLd data={graph(
        { "@type": "ItemList", name: "Библиотеки NikAlimp", itemListElement: items.map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.title, url: `${site.url}${l.href}` })) },
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "Библиотеки", path: "/libraries/" }]),
      )} />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Библиотеки</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">Справочные базы, которые я собираю для своей работы и открываю всем: стартапы, примеры красивых сайтов, сервисы, термины, визуальные стили, шрифты, дизайн-системы и UI-библиотеки. Всё бесплатно и без регистрации.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {items.map((l) => {
              const Icon = l.icon;
              return (
                <a key={l.href} href={l.href} className="card group flex items-start gap-4 rounded-xl border p-6 hover:bg-accent">
                  <span className="card-icon inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand"><Icon className="size-5" /></span>
                  <div className="flex-1">
                    <p className="font-semibold">{l.title} <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">{count[l.href]}</span></p>
                    <p className="mt-1 text-sm text-muted-foreground">{l.about}</p>
                  </div>
                  <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </a>
              );
            })}
          </div>
          <div className="mx-auto mt-14 max-w-3xl space-y-10">
            <div>
              <h2 className="mb-3 text-xl font-semibold tracking-tight">Зачем эти библиотеки</h2>
              <p className="text-muted-foreground">Когда я делаю сайт или продвигаю проект, постоянно ищу одно и то же: кто уже работает в нише клиента, каким сервисом закрыть задачу, что значит новый термин, какой стиль подойдёт бренду и какой шрифт поддерживает кириллицу. Ответы разбросаны по десяткам сайтов и чатов. Здесь я собрал их в одном месте и проверяю перед публикацией.</p>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-semibold tracking-tight">Чем библиотеки отличаются от продуктов</h2>
              <p className="text-muted-foreground">Продукты решают задачу: генераторы собирают договор или UTM-ссылку, сбор семантики чистит запросы, GEO-аудит проверяет видимость в нейросетях. Библиотеки отвечают на вопросы: что это, где применить, чем заменить и с чем сочетать. Каждая запись — отдельная страница с описанием, примерами и связями с соседними записями, поэтому по ним удобно идти от общего к частному.</p>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-semibold tracking-tight">Как часто обновляются</h2>
              <p className="text-muted-foreground">Базу стартапов и каталог инструментов обновляю каждый месяц: добавляю новые проекты, сверяю цены и доступность из России. Глоссарий и дизайн-направления пополняются по мере того, как появляются новые термины и тренды. Нашли ошибку или хотите что-то добавить — <a href={site.telegram} target="_blank" rel="noopener" className="text-foreground underline underline-offset-4">напишите мне в Telegram</a>.</p>
            </div>
          </div>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
