import type { Metadata } from "next";
import { getFonts } from "@/lib/fonts";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { FontCatalog } from "@/components/font-catalog";
import { faqSchema, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Бесплатные шрифты с кириллицей: каталог с превью",
  description: "Бесплатные кириллические шрифты для сайтов и дизайна: как выглядит каждый, сколько начертаний, можно ли использовать в коммерции и с чем сочетать.",
  alternates: { canonical: "/fonts/" },
};

const faq = [
  { q: "Можно ли использовать эти шрифты в коммерческих проектах", a: "Шрифты с пометкой «Для коммерции» можно использовать в рекламе, на сайтах и в продуктах. Шрифты «Для личного использования» подходят для учёбы и некоммерческих работ. Точные условия — на странице шрифта, в блоке «Лицензия»." },
  { q: "Все ли шрифты поддерживают кириллицу", a: "Да, в каталоге только шрифты с русскими буквами. Набор знаков у них разный: у части нет украинских или казахских букв, поэтому проверьте нужные символы на образце перед покупкой макета." },
  { q: "Как подключить шрифт к сайту", a: "Скачайте файлы, переведите их в формат WOFF2 и подключите через @font-face. На странице каждого шрифта есть готовый CSS. Для Tilda и Webflow шрифт загружается в настройках проекта." },
  { q: "Как подобрать пару к шрифту", a: "Сочетайте акцидентный шрифт для заголовков со спокойным гротеском для текста: например, выразительный дисплейный и Inter или Onest. На странице шрифта есть блок «С чем сочетать»." },
];

export default function FontsPage() {
  const fonts = getFonts();
  const cards = fonts.map((f) => ({ s: f.s, n: f.n, c: f.c, k: f.st.length, a: f.a.map((x) => x.n).join(", "), svg: f.svg }));
  const counts = { all: fonts.length, c: fonts.filter((f) => f.c).length, p: fonts.filter((f) => !f.c).length };
  return (
    <>
      <JsonLd data={graph(
        { "@type": "CollectionPage", name: "Бесплатные шрифты с кириллицей", description: metadata.description, url: `${site.url}/fonts/`, inLanguage: "ru-RU" },
        { "@type": "ItemList", name: "Шрифты с кириллицей", numberOfItems: fonts.length, itemListElement: fonts.slice(0, 100).map((f, i) => ({ "@type": "ListItem", position: i + 1, name: f.n, url: `${site.url}/fonts/${f.s}/` })) },
        faqSchema(faq),
      )} />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Бесплатные шрифты с кириллицей</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            {fonts.length} шрифтов с русскими буквами для сайтов, презентаций и упаковки. У каждого — превью, начертания, автор и условия лицензии: можно ли использовать в коммерции. {counts.c} из них подходят для коммерческих проектов.
          </p>
          <FontCatalog initial={cards.slice(0, 60)} total={fonts.length} counts={counts} />
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">Как выбрать шрифт</h2>
            <div className="prose-site mt-4">
              <p>Сначала решите, где шрифт будет работать. Для длинного текста на сайте нужен спокойный гротеск или антиква с несколькими начертаниями: обычным, полужирным и курсивом. Для заголовков, логотипа и обложек подойдёт акцидентный шрифт с характером — у него часто одно начертание, и это нормально.</p>
              <p>Потом проверьте лицензию. Бесплатный шрифт не всегда можно ставить в рекламу или продукт: у части шрифтов разрешено только личное использование. И проверьте знаки: ё, кавычки-ёлочки, тире и цифры — на образце они видны сразу.</p>
            </div>
            <h2 className="mt-12 text-2xl font-semibold tracking-tight">Частые вопросы</h2>
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
