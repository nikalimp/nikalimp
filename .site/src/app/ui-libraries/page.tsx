import type { Metadata } from "next";
import Link from "next/link";
import { TYPE_LABEL, TYPE_ORDER, getSystems, getUiLibraries, plural } from "@/lib/design-systems";
import { site } from "@/lib/site";
import { typograf } from "@/lib/typograf.mjs";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { DsCard } from "@/components/ds-parts";
import { DsFilter } from "@/components/ds-filter";
import { JsonLd } from "@/components/json-ld";
import { LeadMagnet } from "@/components/lead-magnet";
import { faqSchema, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "UI-библиотеки: блоки, компоненты и анимации для сайтов",
  description: "Готовые секции, анимации, шаблоны, иконки и Figma-киты для shadcn/ui, Tailwind, React и Vue: цены, лицензии и совместимость с дизайн-системами.",
  alternates: { canonical: "/ui-libraries/" },
};

const faq = [
  { q: "Чем UI-библиотека отличается от дизайн-системы", a: "Дизайн-система задаёт основу: токены, правила и базовые компоненты. UI-библиотека ставится поверх неё и добавляет готовое: секции лендинга, анимированные эффекты, шаблоны дашбордов, иконки. Поэтому у каждой библиотеки в каталоге указано, к каким системам она подходит." },
  { q: "Что такое блоки и секции", a: "Это целые части страницы: первый экран, тарифы, отзывы, вопросы и ответы, подвал. Их копируют в проект и меняют тексты и картинки — страница собирается за час вместо дня." },
  { q: "Можно ли пользоваться бесплатными библиотеками в коммерческих проектах", a: "Чаще всего да: большинство библиотек выходят по лицензии MIT. Но у некоторых свои условия — например, MIT с Commons Clause запрещает перепродавать сами компоненты. Лицензия указана на странице каждой библиотеки." },
  { q: "Как оплатить Pro-версию из России", a: "Почти все платные библиотеки принимают только зарубежные карты. Варианты — карта иностранного банка или помощь посредника. Бесплатных частей обычно хватает для старта." },
];

export default function UiLibrariesPage() {
  const libs = getUiLibraries();
  const systems = getSystems();
  const tabs = [{ key: "all", label: "Все", count: libs.length }, ...TYPE_ORDER.map((t) => ({ key: t, label: TYPE_LABEL[t], count: libs.filter((l) => l.types.includes(t)).length })).filter((t) => t.count)];
  return (
    <>
      <JsonLd data={graph(
        { "@type": "ItemList", name: "UI-библиотеки", url: `${site.url}/ui-libraries/`, numberOfItems: libs.length, itemListElement: libs.map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.name, url: `${site.url}/ui-libraries/${l.slug}/` })) },
        faqSchema(faq),
      )} />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">UI-библиотеки</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {typograf(`${libs.length} ${plural(libs.length, "библиотека", "библиотеки", "библиотек")} готовых блоков, компонентов, анимаций и шаблонов. У каждой указано, к какой из ${systems.length} дизайн-систем она подходит, сколько стоит и как оплатить из России.`)}
          </p>
          <p className="mt-3 text-center text-sm"><Link href="/design-systems/" className="text-brand hover:underline">Выбрать по дизайн-системе →</Link></p>
          <DsFilter listId="lib-list" tabs={tabs} placeholder="Название, тип или фреймворк" unit={["библиотека", "библиотеки", "библиотек"]} />
          <ul id="lib-list" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {libs.map((l) => <DsCard key={l.slug} x={l} tags={l.types.join(" ")} />)}
          </ul>
          <LeadMagnet kind="ui-library" name="готовыми блоками и анимациями" className="mx-auto mt-14 max-w-3xl" />
          <div className="mx-auto mt-14 max-w-3xl space-y-8">
            <div>
              <h2 className="mb-3 text-xl font-semibold tracking-tight">Как выбрать библиотеку</h2>
              <p className="text-muted-foreground">{typograf("Сначала выберите дизайн-систему, потом — библиотеки к ней. Блоки нужны для лендингов и маркетинговых страниц, шаблоны — чтобы стартовать с готового сайта или дашборда, анимации — для выразительного первого экрана. Проверьте, когда библиотека обновлялась последний раз: заброшенные проекты отмечены плашкой «Обновляется редко».")}</p>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-semibold tracking-tight">Частые вопросы</h2>
              <div className="divide-y rounded-xl border">
                {faq.map((f) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="cursor-pointer font-medium">{typograf(f.q)}</summary>
                    <p className="mt-2 text-muted-foreground">{typograf(f.a)}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
