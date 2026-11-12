import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Download } from "lucide-react";
import { fileName, getFont, getFonts, getFontsMeta, styleName, type FontFamily } from "@/lib/fonts";
import { site } from "@/lib/site";
import { metaDesc, metaTitle } from "@/lib/utils";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { FontCard } from "@/components/font-parts";
import { LeadMagnet } from "@/components/lead-magnet";
import { FontSpecimen } from "@/components/font-specimen";
import { breadcrumbs, faqSchema, graph } from "@/lib/schema";

export function generateStaticParams() {
  const all = getFonts();
  return all.length ? all.map((f) => ({ slug: f.s })) : [{ slug: "none" }];
}

const word = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "начертание" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "начертания" : "начертаний");
const use = (f: FontFamily) => (f.c ? "бесплатен для личных и коммерческих проектов" : "бесплатен только для личного использования");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const f = getFont(slug);
  if (!f) return {};
  const desc = `Шрифт ${f.n} с кириллицей: ${f.st.length} ${word(f.st.length)}, ${use(f)}. Образец, автор, лицензия, CSS для сайта и пары для сочетания.`;
  return { title: metaTitle(f.n.length > 24 ? `Шрифт ${f.n}` : `Шрифт ${f.n}: скачать бесплатно, кириллица`), description: metaDesc(desc), alternates: { canonical: `/fonts/${f.s}/` } };
}

const card = (f: FontFamily) => ({ s: f.s, n: f.n, c: f.c, k: f.st.length, a: f.a.map((x) => x.n).join(", "), svg: f.svg });
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

export default async function FontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = getFont(slug);
  if (!f) notFound();
  const { sample } = getFontsMeta();
  const all = new Map(getFonts().map((x) => [x.s, x]));
  const pairs = f.pairs.map((p) => all.get(p)).filter((x): x is FontFamily => !!x).slice(0, 4);
  const similar = f.sim.map((p) => all.get(p)).filter((x): x is FontFamily => !!x).slice(0, 4);
  const family = `NA ${f.n}`;
  const live = f.gw ?? [];
  const regular = f.st.find(([w, i]) => w === 400 && !i) ?? f.st[0] ?? [400, 0];
  const authors = f.a.map((a) => a.n).join(", ");
  const url = `/fonts/${f.s}/`;
  const faq = [
    { q: `Можно ли использовать шрифт ${f.n} в коммерческих целях?`, a: f.c ? `Да, ${f.n} разрешён для коммерческих проектов: сайтов, рекламы, упаковки и продуктов. Перед использованием всё же прочитайте лицензию в архиве со шрифтом.` : `Нет, ${f.n} бесплатен только для личного использования: учёбы, портфолио, некоммерческих работ. Для рекламы и продуктов нужна коммерческая лицензия от автора.` },
    { q: `Есть ли у шрифта ${f.n} кириллица?`, a: `Да, в ${f.n} есть русские буквы. Проверьте на образце нужные знаки — ё, кавычки-ёлочки и тире, — прежде чем ставить шрифт в макет.` },
    { q: `Сколько начертаний у шрифта ${f.n}?`, a: `${f.st.length} ${word(f.st.length)}: ${f.st.map(styleName).join(", ")}.` },
  ];
  const facts: [string, React.ReactNode][] = [
    ...(f.a.length ? [["Автор", <span key="a">{f.a.map((a, i) => <span key={a.n}>{i > 0 && ", "}{a.u ? <a href={a.u} target="_blank" rel="nofollow noopener" className="text-brand hover:underline">{a.n}</a> : a.n}</span>)}</span>] as [string, React.ReactNode]] : []),
    ["Начертания", `${f.st.length}: ${f.st.map(styleName).join(", ")}`],
    ["Использование", f.c ? "Личное и коммерческое" : "Только личное"],
    ...(f.lic ? [["Лицензия", f.lic] as [string, React.ReactNode]] : []),
    ...(f.allow ? [["Разрешено", f.allow] as [string, React.ReactNode]] : []),
    ...(f.limit ? [["Ограничения", f.limit] as [string, React.ReactNode]] : []),
  ];
  const css = `@font-face {\n  font-family: "${f.n}";\n  src: url("/assets/fonts/${f.s}-${fileName(regular)}.woff2") format("woff2");\n  font-weight: ${regular[0]};\n  font-style: ${regular[1] ? "italic" : "normal"};\n  font-display: swap;\n}\n\nh1, h2 {\n  font-family: "${f.n}", sans-serif;\n}`;
  return (
    <>
      {live.length > 0 && <style>{live.map((s) => `@font-face{font-family:"${family}";src:url(/font-files/${f.s}/${fileName(s)}.woff2) format("woff2");font-weight:${s[0]};font-style:${s[1] ? "italic" : "normal"};font-display:swap}`).join("")}</style>}
      <JsonLd data={graph(
        { "@type": "CreativeWork", name: `Шрифт ${f.n}`, genre: "шрифт", url: `${site.url}${url}`, inLanguage: "ru-RU", ...(authors ? { author: f.a.map((a) => ({ "@type": "Person", name: a.n, ...(a.u ? { url: a.u } : {}) })) } : {}), ...(f.svg ? { image: `${site.url}/font-previews/${f.s}.svg` } : {}), isAccessibleForFree: true },
        faqSchema(faq),
        breadcrumbs([{ name: "Главная", path: "/" }, { name: "Шрифты", path: "/fonts/" }, { name: f.n, path: url }]),
      )} />
      <Section className="pt-12">
        <Container className="max-w-4xl">
          <nav aria-label="Хлебные крошки" className="mb-6 text-center text-sm text-muted-foreground"><Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/fonts/" className="hover:text-foreground">Шрифты</Link></nav>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Шрифт {f.n}</h1>
          <p className="mt-3 text-center text-muted-foreground">{f.st.length} {word(f.st.length)} · {f.c ? "для коммерции" : "для личного использования"}{authors && ` · ${authors}`}</p>
          <div className="mt-8 flex min-h-48 items-center justify-center rounded-2xl border bg-muted/50 p-8 sm:p-12">
            {f.svg ? <img src={`/font-previews/${f.s}.svg`} alt={`Название ${f.n}, набранное этим шрифтом`} className="max-h-32 w-auto max-w-full dark:invert" /> : <span className="text-5xl" style={live.length ? { fontFamily: `"${family}"` } : undefined}>{f.n}</span>}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {f.zip && <a href={f.zip} rel="nofollow" className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"><Download className="size-4" />Скачать шрифт {f.n}</a>}
            {f.a[0]?.u && <a href={f.a[0].u} target="_blank" rel="nofollow noopener" className="inline-flex h-10 items-center gap-1.5 rounded-lg border px-4 text-sm font-medium hover:bg-accent">{host(f.a[0].u)}<ArrowUpRight className="size-4" /></a>}
          </div>

          {live.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-2xl font-semibold tracking-tight">Образец текста</h2>
              <FontSpecimen family={family} sample={sample.split(". ")[0] + "."} styles={live.map((s) => ({ w: s[0], i: s[1], label: styleName(s) }))} />
            </div>
          )}

          <LeadMagnet kind="font-pair" name={f.n} className="mx-auto mt-10 max-w-3xl" />
          <div className="mx-auto mt-10 max-w-3xl">
            <dl className="grid gap-3 rounded-xl border bg-card p-5 text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                  <dt className="w-32 shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="min-w-0">{v}</dd>
                </div>
              ))}
            </dl>
            <article className="prose-site mt-10">
              {f.about && <><h2>О шрифте</h2><p>{f.about}</p></>}
              <h2>Можно ли использовать в коммерции</h2>
              <p>{f.c ? `Да. ${f.n} ${use(f)}: его можно ставить на сайт, в рекламу, презентации, упаковку и логотипы.` : `Нет. ${f.n} ${use(f)}: учёба, портфолио, личные открытки и некоммерческие проекты. Для рекламы, продукта или сайта компании напишите автору и купите коммерческую лицензию.`} Условия лицензии всегда лежат в архиве со шрифтом — прочитайте их перед запуском проекта.</p>
              <h2>Как подключить шрифт на сайт</h2>
              <p>Скачайте архив и переведите нужные начертания в формат WOFF2: он весит меньше всего и работает во всех современных браузерах. Положите файлы в папку сайта и подключите их через <code>@font-face</code>. Свойство <code>font-display: swap</code> покажет текст сразу, пока шрифт загружается.</p>
              <pre><code>{css}</code></pre>
              <p>В Tilda шрифт загружается в настройках проекта, в разделе «Шрифты и цвета». В Webflow — в Site settings → Fonts → Custom fonts. В Figma достаточно установить шрифт в систему и перезапустить приложение.</p>
              <h2>Частые вопросы</h2>
              {faq.map((x) => <div key={x.q}><h3>{x.q}</h3><p>{x.a}</p></div>)}
            </article>
          </div>

          {pairs.length > 0 && (
            <div className="mt-14">
              <h2 className="text-center text-2xl font-semibold tracking-tight">С чем сочетать {f.n}</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{pairs.map((p) => <FontCard key={p.s} f={card(p)} />)}</ul>
            </div>
          )}
          {similar.length > 0 && (
            <div className="mt-14">
              <h2 className="text-center text-2xl font-semibold tracking-tight">Похожие шрифты</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{similar.map((p) => <FontCard key={p.s} f={card(p)} />)}</ul>
              <p className="mt-6 text-center text-sm"><Link href="/fonts/" className="text-brand hover:underline">Все шрифты с кириллицей →</Link></p>
            </div>
          )}
        </Container>
      </Section>
      <Cta />
    </>
  );
}
