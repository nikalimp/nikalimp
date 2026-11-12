import type { Metadata } from "next";
import Link from "next/link";
import { getDesignStyles } from "@/lib/design-styles";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { StyleCover } from "@/components/style-cover";
import { faqSchema, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Дизайн-направления: 20 визуальных стилей с примерами",
  description: "Стили дизайна для сайтов и презентаций с живыми примерами: глассморфизм, необрутализм, баухаус, неон, пиксель-арт и другие. Цвета, шрифты и промпты.",
  alternates: { canonical: "/design-styles/" },
};

const faq = [
  { q: "Как выбрать стиль для сайта", a: "Начните с аудитории и задачи. Банку и юристам подойдут спокойные стили: стекло, градиент, чертёж. Креативным студиям и играм — неон, пиксель-арт, необрутализм. Стиль должен усиливать смысл, а не спорить с ним." },
  { q: "Можно ли смешивать стили", a: "Можно, если один главный, а второй — акцент. Например, необрутализм с элементами комикса или градиент со стеклянными карточками. Три и больше стилей на странице спорят друг с другом." },
  { q: "Не замедлят ли анимации сайт", a: "Большинство эффектов делается на CSS и SVG и почти не весит. Тяжёлые сцены на canvas или WebGL стоит запускать только на экране и выключать при настройке «меньше движения» — так сделаны примеры в этой библиотеке." },
  { q: "Как получить такой стиль от нейросети", a: "На странице каждого стиля есть готовый промпт: композиция, цвета в HEX, шрифты и анимация. Вставьте его в Claude или другую нейросеть и уточните под свою задачу." },
];

export default function DesignStylesPage() {
  const styles = getDesignStyles();
  return (
    <>
      <JsonLd data={graph(
        { "@type": "ItemList", name: "Дизайн-направления", url: `${site.url}/design-styles/`, numberOfItems: styles.length, itemListElement: styles.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: `${site.url}/design-styles/${s.slug}/` })) },
        faqSchema(faq),
      )} />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Дизайн-направления</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {styles.length} визуальных стилей для сайтов, презентаций и соцсетей. У каждого — живой пример, история, признаки, цвета и шрифты, типичные ошибки и готовый промпт для нейросети.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {styles.map((s) => (
              <li key={s.slug}>
                <Link href={`/design-styles/${s.slug}/`} className="group block h-full overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand/40">
                  <StyleCover slug={s.slug} />
                  <span className="block p-4">
                    <span className="block font-semibold group-hover:text-brand">{s.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{s.short}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
      <Cta />
    </>
  );
}
