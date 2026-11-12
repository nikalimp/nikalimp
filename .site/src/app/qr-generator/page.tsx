import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { QrGenerator } from "@/components/qr-generator";
import { breadcrumbs, faqSchema, graph, orgId } from "@/lib/schema";

const path = "/qr-generator/";
const title = "Генератор QR-кода";
const answer = "Генератор делает QR-код для ссылки, визитки, Telegram, Wi-Fi, почты или телефона. В центр можно поставить логотип или аватар в круге или квадрате, поменять цвета и форму точек. Готовый код скачивается в SVG, PNG или JPEG, до 100 кодов — одним архивом. Бесплатно, без регистрации: картинка и данные остаются в вашем браузере.";

const tips = [
  { title: "Проверьте код камерой", text: "Перед печатью отсканируйте код двумя-тремя телефонами — особенно если поставили картинку больше 25 % или светлые цвета." },
  { title: "Оставьте поля", text: "Белая рамка вокруг кода — минимум 4 точки. Без неё камера путает код с фоном макета." },
  { title: "Печатайте не меньше 2 см", text: "На визитке — от 2 × 2 см, на плакате — примерно десятая часть расстояния, с которого будут сканировать." },
  { title: "Следите за подсказками", text: "Генератор предупредит, если код плотный, светлее фона или с низким контрастом. Такие коды камера читает хуже." },
  { title: "Добавьте UTM-метки", text: "Тогда в Метрике будет видно, сколько людей пришло с визитки, флаера или витрины. Метки собирает генератор UTM." },
];

const faq = [
  { q: "Как проверить, что код считывается?", a: "Генератор проверяет это сам: рисует код и читает его встроенным распознавателем браузера. Если текст совпал — увидите «Код считывается». Распознаватель есть в Chrome на Android и macOS. В других браузерах наведите на код камеру телефона." },
  { q: "Как сделать много QR-кодов сразу?", a: "Откройте вкладку «Пачкой» и вставьте до 100 строк: ссылки, номера столов, артикулы. Генератор покажет все коды и соберёт их в ZIP-архив в PNG или SVG. Файлы назовутся по содержимому кода." },
  { q: "QR-код перестанет работать через время?", a: "Нет. Это статический код: данные зашиты в саму картинку, без сервисов-посредников и подписки. Код работает, пока работает ссылка внутри." },
  { q: "Можно ли поставить логотип в центр?", a: "Да. Загрузите картинку, выберите круг или квадрат и размер. Генератор включает максимальную коррекцию ошибок: до 30 % кода можно закрыть, и он всё равно считается." },
  { q: "Куда загружается моя картинка?", a: "Никуда. Файл читается прямо в браузере и встраивается в QR-код. На сервер ничего не отправляется, после закрытия вкладки картинка исчезает." },
  { q: "Какой формат скачать?", a: "SVG — для типографии и макетов в Figma или Illustrator: код не теряет качество при любом размере. PNG — для сайта, презентаций и соцсетей. JPEG — когда нужен самый лёгкий файл на белом фоне." },
  { q: "Как сделать QR-визитку?", a: "Выберите тип «Визитка» и заполните имя, телефон, почту и сайт. Камера телефона предложит сохранить контакт в записную книжку одним нажатием." },
  { q: "Как поделиться Wi-Fi через QR-код?", a: "Выберите «Wi-Fi», укажите название сети, пароль и тип защиты. Гости наведут камеру и подключатся без ввода пароля." },
];

export const metadata: Metadata = {
  title: "Генератор QR-кода с логотипом — SVG, PNG, JPEG",
  description: "Бесплатный генератор QR-кода: ссылка, визитка, Wi-Fi, Telegram. Логотип в центре в круге или квадрате, свои цвета, скачивание в SVG, PNG и JPEG.",
  alternates: { canonical: path },
};

export default function QrGeneratorPage() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "WebApplication", name: title, description: answer, url: `${site.url}${path}`, applicationCategory: "DesignApplication", operatingSystem: "Any", inLanguage: "ru-RU", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" }, provider: { "@id": orgId } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Генератор QR-кода", path }]),
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
          <QrGenerator />
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Перед печатью</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Как сделать, чтобы код точно считался</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {tips.map((t) => (
              <li key={t.title}>
                <p className="font-medium">{t.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-muted-foreground">Метки для ссылки в QR-коде — в <Link href="/utm-generator/" className="text-brand hover:underline">генераторе UTM-меток</Link>. QR-визитка входит в <Link href="/services/personal-website/" className="text-brand hover:underline">личный сайт</Link> под ключ.</p>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Вопросы о QR-кодах</h2>
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
