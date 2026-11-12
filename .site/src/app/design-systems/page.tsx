import type { Metadata } from "next";
import Link from "next/link";
import { FAMILY, getSystems, getUiLibraries, librariesOf, plural, type Family } from "@/lib/design-systems";
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
  title: { absolute: "Дизайн-системы для сайтов: shadcn/ui, MUI, Gravity UI и другие" },
  description: "Дизайн-системы с библиотеками блоков и анимаций: shadcn/ui, Tailwind, React, Vue, российские Gravity UI и Taiga UI. Цены, лицензии, работа из России.",
  alternates: { canonical: "/design-systems/" },
};

const faq = [
  { q: "Что такое дизайн-система", a: "Это набор правил и готовых деталей интерфейса: цвета, шрифты, отступы, радиусы и компоненты — кнопки, поля, карточки, меню. Все страницы сайта собираются из одних деталей, поэтому выглядят единообразно, а новая страница делается за часы, а не за дни." },
  { q: "Зачем выбирать одну систему, а не собирать сайт из разных библиотек", a: "Компоненты из разных систем по-разному понимают цвета, отступы и состояния. Сайт из них выглядит лоскутным, а каждое обновление ломает что-то в соседнем блоке. Одна система с большой библиотекой секций и анимаций сверху даёт и скорость, и цельный вид." },
  { q: "Какую дизайн-систему выбрать для сайта на Next.js", a: "Для маркетингового сайта или сервиса на React и Next.js чаще всего берут shadcn/ui: код компонентов лежит в проекте, а библиотек блоков и анимаций к нему больше, чем к любой другой системе. Для сложных админок с таблицами подойдут Ant Design, MUI или Mantine." },
  { q: "Есть ли российские дизайн-системы с открытым кодом", a: "Да: Gravity UI (Яндекс), Taiga UI (Т-Банк), VKUI (VK), Plasma (Сбер), Core Components (Альфа-Банк), Kontur UI и Consta. У всех лицензии MIT или Apache-2.0, пакеты ставятся из npm без оплаты." },
];

const ORDER: Family[] = ["shadcn", "tailwind", "react", "vue-svelte", "ru", "enterprise", "css"];

export default function DesignSystemsPage() {
  const systems = getSystems().sort((a, b) => librariesOf(b.slug).length - librariesOf(a.slug).length || ORDER.indexOf(a.family!) - ORDER.indexOf(b.family!));
  const libs = getUiLibraries();
  const tabs = [{ key: "all", label: "Все", count: systems.length }, ...ORDER.map((f) => ({ key: f, label: FAMILY[f].label, count: systems.filter((s) => s.family === f).length }))];
  return (
    <>
      <JsonLd data={graph(
        { "@type": "ItemList", name: "Дизайн-системы", url: `${site.url}/design-systems/`, numberOfItems: systems.length, itemListElement: systems.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: `${site.url}/design-systems/${s.slug}/` })) },
        faqSchema(faq),
      )} />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Дизайн-системы</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {typograf(`${systems.length} дизайн-систем для сайтов и сервисов — и ${libs.length} ${plural(libs.length, "библиотека", "библиотеки", "библиотек")} блоков, компонентов и анимаций к ним. У каждой системы — цена, лицензия, работа из России и все подходящие библиотеки.`)}
          </p>
          <p className="mt-3 text-center text-sm"><Link href="/ui-libraries/" className="text-brand hover:underline">Все UI-библиотеки →</Link></p>
          <DsFilter listId="ds-list" tabs={tabs} placeholder="Название, фреймворк или задача" unit={["система", "системы", "систем"]} />
          <ul id="ds-list" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {systems.map((s) => <DsCard key={s.slug} x={s} tags={s.family} />)}
          </ul>
          <LeadMagnet kind="styles" className="mx-auto mt-14 max-w-3xl" />
          <div className="mx-auto mt-14 max-w-3xl space-y-8">
            <div>
              <h2 className="mb-3 text-xl font-semibold tracking-tight">Почему одна система лучше набора библиотек</h2>
              <p className="text-muted-foreground">{typograf("Я сделал больше 100 сайтов и пришёл к простому выводу: быстрее и аккуратнее всего получается, когда проект стоит на одной дизайн-системе, а сверху подключены большие библиотеки секций и анимаций к ней. Например, shadcn/ui и 21st.dev. Токены цвета и радиуса задаются один раз, блоки встают без подгонки, а новая страница собирается из готовых секций.")}</p>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-semibold tracking-tight">Как устроен каталог</h2>
              <p className="text-muted-foreground">{typograf("Системы разбиты на семь групп по стеку и происхождению. На странице системы — описание, цена и лицензия, способ установки, доступность из России и поддержка ИИ-агентов, а ниже все библиотеки, которые к ней подходят. Библиотеки собраны в отдельный каталог: там их удобно фильтровать по типу — блоки, анимации, шаблоны, иконки, Figma-киты.")}</p>
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
