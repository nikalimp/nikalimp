import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FAMILY, TYPE_LABEL, TYPE_ORDER, faqFor, getSystem, getSystems, librariesOf, plural, servicesFor, universalLibraries, type DsItem } from "@/lib/design-systems";
import { serviceBySlug } from "@/lib/services";
import { site } from "@/lib/site";
import { metaDesc, metaTitle } from "@/lib/utils";
import { typograf } from "@/lib/typograf.mjs";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { DsCover } from "@/components/ds-cover";
import { DsCard, DsFacts, DsStatus } from "@/components/ds-parts";
import { JsonLd } from "@/components/json-ld";
import { LeadMagnet } from "@/components/lead-magnet";
import { ServiceCard } from "@/components/service-card";
import { breadcrumbs, faqSchema, graph, personId } from "@/lib/schema";

export function generateStaticParams() {
  const all = getSystems();
  return all.length ? all.map((s) => ({ slug: s.slug })) : [{ slug: "none" }];
}

// Самый длинный вариант заголовка, который влезает в 65 знаков вместе с « — NikAlimp», иначе короче
const fit = (v: string[]) => v.find((x) => x.length + 11 <= 65) ?? v.find((x) => x.length <= 65) ?? v[v.length - 1];
const titleOf = (s: DsItem) => fit([`${s.name}: дизайн-система, библиотеки блоков и компонентов`, `${s.name}: дизайн-система и библиотеки блоков`, `${s.name}: дизайн-система и библиотеки`, `${s.name} — дизайн-система`]);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getSystem(slug);
  if (!s) return {};
  const n = librariesOf(s.slug).length;
  const desc = `${s.name} — ${s.short.replace(/\.$/, "").toLowerCase()}. ${s.about}${n ? ` ${n} ${plural(n, "библиотека", "библиотеки", "библиотек")} блоков, компонентов и анимаций к системе.` : ""}`;
  return { title: metaTitle(titleOf(s)), description: metaDesc(desc), alternates: { canonical: `/design-systems/${s.slug}/` }, openGraph: { type: "article", title: titleOf(s), description: metaDesc(desc) } };
}

export default async function DesignSystemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getSystem(slug);
  if (!s) notFound();
  const libs = librariesOf(s.slug);
  const any = universalLibraries().filter((l) => l.status === "active").sort((a, b) => a.name.localeCompare(b.name, "en")).slice(0, 6);
  const groups = TYPE_ORDER.map((t) => ({ t, list: libs.filter((l) => l.types[0] === t) })).filter((g) => g.list.length);
  const similar = getSystems().filter((x) => x.family === s.family && x.slug !== s.slug).sort((a, b) => librariesOf(b.slug).length - librariesOf(a.slug).length).slice(0, 3);
  const services = servicesFor(s).map(serviceBySlug).filter((x): x is NonNullable<typeof x> => !!x);
  const faq = faqFor(s, libs);
  const fam = FAMILY[s.family!];
  const url = `/design-systems/${s.slug}/`;
  return (
    <>
      <JsonLd data={graph(
        { "@type": "Article", headline: titleOf(s), description: s.about, url: `${site.url}${url}`, inLanguage: "ru-RU", author: { "@id": personId }, dateModified: s.checked, about: { "@type": "SoftwareSourceCode", name: s.name, url: s.url, ...(s.github ? { codeRepository: `https://github.com/${s.github}` } : {}), ...(s.license ? { license: s.license } : {}), programmingLanguage: s.frameworks } },
        ...(libs.length ? [{ "@type": "ItemList", name: `Библиотеки для ${s.name}`, itemListElement: libs.map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.name, url: `${site.url}/ui-libraries/${l.slug}/` })) }] : []),
        faqSchema(faq),
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "Библиотеки", path: "/libraries/" }, { name: "Дизайн-системы", path: "/design-systems/" }, { name: s.name, path: url }]),
      )} />
      <Section className="pt-12">
        <Container className="max-w-5xl">
          <nav aria-label="Хлебные крошки" className="mb-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/libraries/" className="hover:text-foreground">Библиотеки</Link> / <Link href="/design-systems/" className="hover:text-foreground">Дизайн-системы</Link>
          </nav>
          <p className="text-center font-mono text-[11px] uppercase tracking-wider text-brand">{fam.label}</p>
          <h1 className="mx-auto mt-2 max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">{s.name}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-muted-foreground">{s.short}</p>
          <DsCover item={s} className="mx-auto mt-8 max-w-3xl rounded-2xl border shadow-sm" />
          <DsStatus x={s} />

          <div className="prose-site mx-auto mt-10 max-w-3xl">
            <h2>Что такое {s.name}</h2>
            <p>{s.about}</p>
            {s.best_for && <p>{typograf(`Для каких проектов: ${s.best_for}.`)}</p>}
            <p>{fam.text}</p>
            {s.tool && <p>Подробный обзор с тарифами и аналогами — в <Link href={`/tools/${s.tool}/`}>каталоге инструментов</Link>.</p>}
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">{s.name} коротко</h2>
            <DsFacts x={s} />
          </div>

          <div className="mt-16">
            <h2 className="text-center text-2xl font-semibold tracking-tight">{libs.length ? `Библиотеки для ${s.name}` : "Библиотеки"}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              {typograf(libs.length
                ? `${libs.length} ${plural(libs.length, "библиотека", "библиотеки", "библиотек")} поверх системы: готовые секции, компоненты, анимации, шаблоны и темы. Подключайте их к проекту, чтобы не рисовать каждый блок с нуля.`
                : `Отдельных библиотек секций и анимаций для ${s.name} в каталоге пока нет: система закрывает основные задачи своими компонентами. Ниже — универсальные библиотеки анимаций, которые работают с любым стеком.`)}
            </p>
            {groups.map((g) => (
              <section key={g.t} className="mt-10" aria-labelledby={`g-${g.t}`}>
                <h3 id={`g-${g.t}`} className="text-lg font-semibold">{TYPE_LABEL[g.t]} <span className="font-mono text-sm font-normal text-muted-foreground">{g.list.length}</span></h3>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{g.list.map((l) => <DsCard key={l.slug} x={l} />)}</ul>
              </section>
            ))}
            <section className="mt-12" aria-labelledby="g-any">
              <h3 id="g-any" className="text-lg font-semibold">Анимации для любой системы</h3>
              <p className="mt-1 text-sm text-muted-foreground">{typograf(`Эти библиотеки не зависят от дизайн-системы и работают вместе с ${s.name}.`)}</p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{any.map((l) => <DsCard key={l.slug} x={l} compact />)}</ul>
              <p className="mt-4 text-sm"><Link href="/ui-libraries/" className="text-brand hover:underline">Все UI-библиотеки →</Link></p>
            </section>
          </div>

          <LeadMagnet kind="design-system" name={s.name} className="mx-auto mt-14 max-w-3xl" />

          {services.length > 0 && (
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-semibold tracking-tight">{typograf(`Сделаю проект на ${s.name}`)}</h2>
              <p className="mt-2 text-muted-foreground">{typograf("Собираю сайты и сервисы на одной дизайн-системе с библиотеками блоков и анимаций: так проект выглядит цельно, а новые страницы появляются быстро. Каждый сайт готов к поиску и ответам нейросетей.")}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">{services.map((x) => <ServiceCard key={x.slug} s={x} />)}</div>
            </div>
          )}

          <div className="mx-auto mt-14 max-w-3xl">
            <h2 className="text-xl font-semibold tracking-tight">Вопросы и ответы: {s.name}</h2>
            <div className="mt-4 divide-y rounded-xl border">
              {faq.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="cursor-pointer font-medium">{f.q}</summary>
                  <p className="mt-2 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {similar.length > 0 && (
            <div className="mt-16">
              <h2 className="text-center text-2xl font-semibold tracking-tight">Похожие системы</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">{similar.map((x) => <DsCard key={x.slug} x={x} compact />)}</ul>
              <p className="mt-6 text-center text-sm"><Link href="/design-systems/" className="text-brand hover:underline">Все дизайн-системы →</Link></p>
            </div>
          )}
        </Container>
      </Section>
      <Cta />
    </>
  );
}
