import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { UtmGenerator } from "@/components/utm-generator";
import { breadcrumbs, faqSchema, graph, orgId } from "@/lib/schema";

const path = "/utm-generator/";
const title = "Генератор UTM-меток";
const answer = "Генератор собирает ссылку с UTM-метками для Яндекс Директа, VK Рекламы, Google Ads, Telegram Ads, посевов и рассылок. Выберите площадку — метки и динамические параметры подставятся сами, кириллица переведётся в латиницу, лишние символы уберутся. Можно разметить сразу список ссылок и получить QR-код. Бесплатно, без регистрации, ссылки остаются в вашем браузере.";

const params = [
  { key: "utm_source", name: "Источник", text: "Площадка или человек, который привёл посетителя.", ex: "yandex, vk, telegram, ivan_blog" },
  { key: "utm_medium", name: "Тип трафика", text: "Канал: платная реклама, рассылка, соцсети, блогеры.", ex: "cpc, email, social, influencer" },
  { key: "utm_campaign", name: "Кампания", text: "Название рекламной кампании или акции.", ex: "personal_site_spring, {campaign_id}" },
  { key: "utm_content", name: "Объявление", text: "Чем отличаются объявления внутри кампании.", ex: "video_15s, banner_blue, {ad_id}" },
  { key: "utm_term", name: "Ключевое слово", text: "Запрос, по которому показали объявление.", ex: "{keyword}, sozdanie_sajta" },
];

const faq = [
  { q: "Что такое UTM-метки?", a: "Это параметры в конце ссылки: ?utm_source=yandex&utm_medium=cpc. Яндекс Метрика и Google Analytics читают их и показывают, из какой рекламы, рассылки или поста пришёл посетитель и сколько заявок он принёс." },
  { q: "Какие метки обязательны?", a: "utm_source, utm_medium и utm_campaign. Без них Метрика не сгруппирует переходы. utm_content и utm_term нужны, когда в кампании несколько объявлений или ключевых слов." },
  { q: "Можно ли писать метки по-русски?", a: "Можно, но в ссылке кириллица превратится в длинный код вида %D0%B2. Генератор по умолчанию переводит её в латиницу: так ссылку удобно читать и в отчётах, и в браузере." },
  { q: "Что такое динамические параметры?", a: "Это макросы в фигурных скобках: {campaign_id}, {keyword}. Рекламная площадка сама подставит вместо них номер кампании или запрос при клике. У каждой площадки свои макросы, генератор показывает список для выбранной." },
  { q: "Где смотреть результат?", a: "В Яндекс Метрике — отчёт «Источники → Метки UTM», в Google Analytics 4 — «Привлечение трафика» с параметрами источника и кампании. Данные появляются после первых переходов по ссылке." },
  { q: "Как разметить много ссылок сразу?", a: "Откройте вкладку «Списком» и вставьте строки или загрузите CSV с колонками url, source, medium, campaign, content, term. Пустые ячейки генератор возьмёт из формы: можно вставить одни адреса и задать общие метки. Готовые ссылки копируются разом или скачиваются CSV-файлом для Excel." },
  { q: "Как отправить настройки коллеге?", a: "Нажмите «Скопировать ссылку на настройки». Адрес страницы и метки попадут в ссылку на генератор: коллега откроет её и увидит ту же форму." },
  { q: "Можно сразу сделать QR-код?", a: "Да. Под готовой ссылкой появляется QR-код, его можно скачать в PNG или SVG. Логотип и свои цвета добавьте в генераторе QR-кода: ссылка с метками откроется там сама." },
  { q: "Где хранится история ссылок?", a: "В вашем браузере. Генератор помнит 20 последних ссылок: любую можно скопировать, взять в работу или удалить. На сервер ничего не уходит." },
  { q: "Метки испортят SEO?", a: "Нет, если на сайте настроен canonical: поисковик склеит ссылку с метками с основной страницей. На всех сайтах, которые я делаю, canonical стоит по умолчанию." },
];

export const metadata: Metadata = {
  title: "Генератор UTM-меток для Директа, VK и Telegram",
  description: "Бесплатный генератор UTM-меток: пресеты Яндекс Директа, VK Рекламы, Google Ads и Telegram, динамические параметры, транслит и копирование ссылки.",
  alternates: { canonical: path },
};

export default function UtmGeneratorPage() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "WebApplication", name: title, description: answer, url: `${site.url}${path}`, applicationCategory: "BusinessApplication", operatingSystem: "Any", inLanguage: "ru-RU", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" }, provider: { "@id": orgId } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Генератор UTM-меток", path }]),
          faqSchema(faq),
        )}
      />
      <Section className="hero pb-10 pt-12">
        <Container className="max-w-3xl">
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">{answer}</p>
        </Container>
      </Section>

      <Section className="hero border-t bg-card pt-10">
        <Container className="max-w-6xl">
          <UtmGenerator />
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Параметры</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Пять UTM-меток и что в них писать</h2>
          <div className="mt-8 overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground">
                <tr><th className="p-3 font-medium">Метка</th><th className="p-3 font-medium">Что значит</th><th className="p-3 font-medium">Примеры</th></tr>
              </thead>
              <tbody className="divide-y">
                {params.map((p) => (
                  <tr key={p.key}>
                    <td className="p-3 align-top"><code className="font-mono text-xs">{p.key}</code><span className="mt-1 block text-xs text-muted-foreground">{p.name}</span></td>
                    <td className="p-3 align-top">{p.text}</td>
                    <td className="p-3 align-top font-mono text-xs text-muted-foreground">{p.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-muted-foreground">Подробнее о метках — в статье <Link href="/blog/utm-tags/" className="text-brand hover:underline">«UTM-метки»</Link> и в глоссарии: <Link href="/glossary/utm-parameters/" className="text-brand hover:underline">UTM-метка</Link>.</p>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Вопросы об UTM-метках</h2>
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
        </Container>
      </Section>
    </>
  );
}
