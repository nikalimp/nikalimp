import { metaDesc, metaTitle } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Layers, ListTree, Megaphone, PenLine, Shuffle } from "lucide-react";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { SemanticsTool } from "@/components/semantics-tool";
import { breadcrumbs, faqSchema, graph, orgId } from "@/lib/schema";

const path = "/semantics/";
const title = "Сбор семантического ядра онлайн";
const answer = `Инструмент чистит и группирует поисковые запросы ниши прямо в браузере. Вставьте выгрузку из Яндекс Вордстата или свой список — он уберёт мусор и словоформы, разделит запросы на коммерческие и информационные и построит структуру сайта. Результат скачивается в Excel и CSV. Разбор своего списка бесплатный и без регистрации, автоматический сбор из Вордстата — платная опция.`;

const steps = [
  { n: "01", title: "Соберите запросы", text: "Вставьте копию таблицы из wordstat.yandex.ru, CSV из Key Collector или просто список фраз. Платная опция соберёт запросы сама: по маскам, региону и глубине." },
  { n: "02", title: "Уберите мусор", text: "Инструмент сам отсеивает маркетплейсы, другие города, фото и видео, «скачать», вакансии и «своими руками». Любую категорию можно вернуть одним переключателем." },
  { n: "03", title: "Дочистите минус-словами", text: "В списке «Слова спроса» видно, из каких слов состоит спрос. Кнопка «−» отправляет слово в минус-слова, таблица обновляется сразу." },
  { n: "04", title: "Постройте структуру", text: "Впишите, что продаёте, — инструмент разложит запросы по страницам сайта и статьям блога. Структура уходит в тот же файл Excel." },
];

const next = [
  { icon: ListTree, title: "Структура сайта", text: "Каждая группа запросов — отдельная страница. Главный запрос группы идёт в title и H1, остальные — в подзаголовки и текст." },
  { icon: PenLine, title: "Тексты и статьи", text: "Информационные запросы — темы для блога. Один запрос с вопросом — одна статья с прямым ответом в первом абзаце: такие тексты цитируют и поиск, и нейросети." },
  { icon: Megaphone, title: "Яндекс Директ", text: "Коммерческие запросы — ключи для рекламы, отсеянные слова — минус-слова. Кнопка «Для Директа» копирует их в нужном формате." },
  { icon: Filter, title: "Минус-слова", text: "Сохраните список минус-слов в Excel: он пригодится при следующем сборе и в рекламных кампаниях." },
  { icon: Shuffle, title: "Генератор фраз", text: "Перемножьте списки слов, чтобы получить маски для Вордстата или ключи для Директа с нужным типом соответствия." },
  { icon: Layers, title: "Техническое задание", text: "Файл с вкладками «В работе», «Структура» и «Минус-слова» — готовая основа ТЗ для копирайтера или разработчика сайта." },
];

const faq = [
  { q: "Что такое семантическое ядро?", a: "Это список поисковых запросов, по которым клиенты ищут ваш товар или услугу, с частотами. По ядру строят структуру сайта, пишут тексты и настраивают рекламу. Чем полнее и чище ядро, тем меньше страниц уходит в пустоту." },
  { q: "Где взять запросы бесплатно?", a: "В Яндекс Вордстате (wordstat.yandex.ru): введите главную фразу ниши, выберите регион и скопируйте таблицу запросов. Повторите для 3⁠–⁠10 масок и вставьте всё во вкладку «Свой список» — дубли инструмент склеит сам." },
  { q: "Чем платная опция отличается от бесплатной?", a: "Бесплатно инструмент разбирает список, который вы собрали сами. Платная опция собирает запросы через официальный API Вордстата: сначала по маскам, затем по хвостам самых частых фраз. За один сбор — до 150 запросов к Вордстату и тысячи фраз." },
  { q: "Как работают минус-слова?", a: "Слово убирает все свои формы: «бесплатно» уберёт и «бесплатный». Звёздочка в конце — всё, что начинается с этих букв: «авто*». Восклицательный знак — только эта форма: «!сам». Фраза из двух слов уберёт запросы, где есть оба слова." },
  { q: "Что такое словоформы и почему их склеивают?", a: "«Натяжные потолки» и «потолки натяжные» — один и тот же спрос. Поисковик покажет на них одну страницу, поэтому в работе остаётся самая частая фраза, а остальные уходят во вкладку «Словоформы»." },
  { q: "Как инструмент определяет тип запроса?", a: "По словам-маркерам. «Купить», «цена», «заказать», «под ключ» — коммерческий. «Как», «почему», «отзывы», «своими руками» — информационный. Бренды и модели латиницей или с цифрами — товарный. Запросы без маркеров — ниша. Маркеры работают по-русски, спорные запросы проверьте глазами." },
  { q: "Куда уходят мои данные?", a: "Никуда. Разбор, отсев и структура считаются в вашем браузере, черновик хранится там же. На сервер уходят только маски для платного сбора из Вордстата." },
];

export const metadata: Metadata = {
  title: metaTitle("Сбор семантического ядра онлайн: чистка и структура сайта"),
  description: metaDesc(answer),
  alternates: { canonical: path },
  openGraph: { title, url: `${site.url}${path}` },
};

export default function SemanticsPage() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "WebApplication", name: title, description: answer, url: `${site.url}${path}`, applicationCategory: "BusinessApplication", operatingSystem: "Any", inLanguage: "ru-RU", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" }, provider: { "@id": orgId } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Продукты", path: "/products/" }, { name: "Сбор семантики", path }]),
          faqSchema(faq),
        )}
      />
      <Section className="hero pb-10 pt-12">
        <Container className="max-w-3xl">
          <nav className="mb-6 text-sm text-muted-foreground text-center"><Link href="/" className="hover:text-foreground">Главная</Link> / <Link href="/products/" className="hover:text-foreground">Продукты</Link> / Сбор семантики</nav>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">{title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-center mx-auto max-w-2xl">{answer}</p>
        </Container>
      </Section>

      <Section className="hero border-t bg-card pt-10">
        <Container className="max-w-6xl">
          <SemanticsTool />
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-5xl">
          <Eyebrow>Как работает</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">От списка запросов к структуре сайта за 4 шага</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n}>
                <p className="font-mono text-sm text-brand">{s.n}</p>
                <p className="mt-2 font-semibold">{s.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>После сбора</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Что делать с семантическим ядром</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {next.map((c) => (
              <li key={c.title} className="flex gap-4">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand"><c.icon className="size-4" /></span>
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-muted-foreground">Ядро нужно не только поиску. Нейросети вроде Алисы и ChatGPT тоже отвечают на вопросы клиентов, и страницы, собранные по реальным запросам, они цитируют чаще. Как подготовить сайт к ответам нейросетей, — на странице <Link href="/geo-audit/" className="text-foreground underline underline-offset-4">GEO-продвижения</Link>.</p>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Вопросы о сборе семантики</h2>
          <div className="mt-8 divide-y border-y">
            {faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}<span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
            Частоты — базовые показы Вордстата за месяц в выбранном регионе. Вложенные частоты не складываются: «натяжные потолки» уже включают «натяжные потолки цена». Отсев и типы запросов — подсказка по словам-маркерам, финальное решение за вами. Пример с натяжными потолками — демонстрация, частоты в нём условные.
          </p>
        </Container>
      </Section>
    </>
  );
}
