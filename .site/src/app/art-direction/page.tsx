import type { Metadata } from "next";
import Link from "next/link";
import { ART_DIRECTION_GROUPS, getArtDirections } from "@/lib/art-direction";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { ArtCover } from "@/components/art-cover";
import { faqSchema, graph } from "@/lib/schema";

const groupId = (i: number) => `group-${i + 1}`;

export const metadata: Metadata = {
  title: "Художественные направления: стили искусства и дизайна",
  description: "Справочник художественных направлений для сайтов, брендов и нейросетей: импрессионизм, ренессанс, античная скульптура, швейцарская вёрстка, глассморфизм и другие.",
  alternates: { canonical: "/art-direction/" },
};

const faq = [
  { q: "Как выбрать художественное направление для сайта", a: "Начните с аудитории и характера бренда. Финансовым, юридическим и архитектурным проектам подходят швейцарская вёрстка, минимализм, классицизм и чертёж. Культурным проектам, ресторанам и брендам с историей — импрессионизм, картина маслом, арт-деко или античная скульптура. Играм и креативным студиям — киберпанк, необрутализм, ризография и пиксель-арт." },
  { q: "Можно ли перенести стиль живописи в современный веб-дизайн", a: "Да. Из живописи берут не копию картины, а систему: палитру, светотень, ритм композиции, характер шрифтов и фактуру иллюстраций. Интерфейс остаётся быстрым и удобным, но получает узнаваемый художественный образ." },
  { q: "Как получить нужный стиль в нейросети", a: "На странице каждого направления есть готовый промпт с композицией, палитрой в HEX, шрифтами и характерными деталями. Вставьте его в Midjourney, ChatGPT или Claude и подставьте свой продукт." },
  { q: "Можно ли заказать сайт в одном из этих стилей", a: "Да. Мы делаем сайты под ключ в любом художественном направлении из каталога: подбираем референсы, собираем дизайн-систему, верстаем быстрый AI-Ready сайт и подключаем SEO-основу. Оставьте заявку на странице нужного стиля — пришлю 3 референса и набросок первого экрана бесплатно." },
];

export default function ArtDirectionPage() {
  const styles = getArtDirections();
  const grouped = ART_DIRECTION_GROUPS.map((g, i) => ({
    id: groupId(i),
    name: g,
    items: styles.filter((s) => s.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "ItemList",
            name: "Художественные направления",
            url: `${site.url}/art-direction/`,
            numberOfItems: styles.length,
            itemListElement: styles.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: s.name,
              url: `${site.url}/art-direction/${s.slug}/`,
              image: `${site.url}/art-direction/${s.slug}.webp`,
            })),
          },
          faqSchema(faq),
        )}
      />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Художественные направления</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {styles.length} художественных и дизайн-направлений для сайтов, брендов и нейросетей: от живописи старых мастеров и античной скульптуры до швейцарской вёрстки и цифровой графики. У каждого — референс, история, палитра, шрифты и готовый промпт.
          </p>
          <nav aria-label="Разделы каталога" className="mt-8 flex flex-wrap justify-center gap-2">
            {grouped.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-brand/50 hover:text-brand">
                {g.name} <span className="ml-1 font-mono text-xs text-muted-foreground">{g.items.length}</span>
              </a>
            ))}
          </nav>

          <div className="mt-12 space-y-14">
            {grouped.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-20">
                <div className="flex items-baseline justify-between border-b pb-3">
                  <h2 className="text-2xl font-semibold tracking-tight">{g.name}</h2>
                  <span className="font-mono text-xs text-muted-foreground">{g.items.length}</span>
                </div>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {g.items.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/art-direction/${s.slug}/`} className="group block h-full overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand/40">
                        <ArtCover slug={s.slug} alt={s.coverAlt} />
                        <span className="block p-4">
                          <span className="block font-semibold group-hover:text-brand">{s.name}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">{s.short}</span>
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
      <Cta offer="design" />
    </>
  );
}
