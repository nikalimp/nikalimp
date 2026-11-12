import { metaDesc } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, FileText, Bell, Cookie, Server, SquareCheck } from "lucide-react";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { PrivacyGenerator } from "@/components/privacy-generator";
import { breadcrumbs, faqSchema, graph, orgId } from "@/lib/schema";

const title = "Генератор политики конфиденциальности для сайта";
const answer = `Генератор собирает политику обработки персональных данных и отдельное согласие по 152-ФЗ за 5 минут. Выберите тип сайта и пройдите четыре шага: оператор, сайт и данные, cookie и сервисы, готовый текст. Документ обновляется сразу. Готовый текст копируется в Tilda, Webflow или любой конструктор, скачивается в HTML. Бесплатно и без регистрации, данные остаются в вашем браузере.`;

const checklist = [
  { icon: FileText, title: "Опубликуйте политику", text: "Отдельной страницей, например /privacy. Ссылку поставьте в подвал каждой страницы." },
  { icon: FileCheck2, title: "Опубликуйте согласие", text: "С 1 сентября 2025 года согласие оформляют отдельно от политики и других документов — второй страницей, например /consent." },
  { icon: SquareCheck, title: "Добавьте чекбокс в формы", text: "Галочка не стоит заранее, без неё форма не отправляется. Текст со ссылками — во вкладке «Чекбокс»." },
  { icon: Bell, title: "Уведомите Роскомнадзор", text: "До начала сбора данных подайте уведомление об обработке персональных данных на pd.rkn.gov.ru." },
  { icon: Server, title: "Храните данные в России", text: "Заявки граждан РФ сначала попадают в базы данных на территории России: хостинг, CRM, почта." },
  { icon: Cookie, title: "Предупредите о cookie", text: "Если стоит Яндекс Метрика или пиксель, включите блок о cookie в генераторе и покажите баннер на сайте." },
];

const faq = [
  { q: "Кому нужна политика обработки персональных данных?", a: "Всем, у кого на сайте есть форма заявки, подписки, регистрации или личный кабинет: имя, телефон и email — это персональные данные. Владелец сайта становится оператором и по 152-ФЗ обязан опубликовать политику и получить согласие." },
  { q: "Чем политика отличается от согласия?", a: "Политика описывает, как владелец сайта обращается с данными всех посетителей. Согласие — разрешение конкретного человека обработать его данные. С 1 сентября 2025 года согласие оформляют отдельным документом, поэтому генератор собирает оба." },
  { q: "Нужно ли склонять ФИО?", a: "Нет. Генератор строит фразы так, что имя или название организации стоит в именительном падеже." },
  { q: "Как вставить политику в Tilda?", a: "Создайте страницу /privacy, добавьте текстовый блок и вставьте текст кнопкой «Копировать» — заголовки и таблица сохранятся. Для HTML-блока используйте кнопку «HTML»." },
  { q: "Можно ли использовать документ без юриста?", a: "Для лендинга, блога или сайта услуг с формой заявки — как основу, да. Если вы собираете паспортные или медицинские данные, работаете с детьми или передаёте данные за границу, покажите документ юристу." },
  { q: "Где хранятся данные, которые я ввожу?", a: "Только в вашем браузере. Генератор работает без сервера: ничего не отправляется, черновик сохраняется сам — закройте вкладку, и при следующем визите форма и шаг будут на месте. Кнопка «Начать заново» очищает форму." },
  { q: "Что дают готовые варианты сайта?", a: "В начале выберите тип: визитка, интернет-магазин, онлайн-школа, сервис с регистрацией или блог. Генератор сам отметит типовые данные, цели обработки и сервисы аналитики. Дальше проверьте отметки на шагах и уберите лишнее." },
];

export const metadata: Metadata = {
  title,
  description: "Бесплатный генератор политики обработки персональных данных и согласия по 152-ФЗ: заполните форму и вставьте готовый текст на сайт за 5 минут.",
  alternates: { canonical: "/privacy-generator/" },
};

export default function PrivacyGeneratorPage() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "WebApplication", name: title, description: answer, url: `${site.url}/privacy-generator/`, applicationCategory: "BusinessApplication", operatingSystem: "Any", inLanguage: "ru-RU", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" }, provider: { "@id": orgId } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Генератор политики", path: "/privacy-generator/" }]),
          faqSchema(faq),
        )}
      />
      <Section className="hero pb-10 pt-12">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">{title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-center mx-auto max-w-2xl">{answer}</p>
        </Container>
      </Section>

      <Section className="hero border-t bg-card pt-10">
        <Container className="max-w-6xl">
          <PrivacyGenerator />
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>После генерации</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Что ещё сделать, чтобы не получить штраф</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.title} className="flex gap-4">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand"><c.icon className="size-4" /></span>
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Вопросы о политике конфиденциальности</h2>
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
            Генератор предоставляется «как есть». Шаблон составлен по Федеральному закону от 27.07.2006 № 152-ФЗ «О персональных данных», но не заменяет консультацию юриста: проверьте, что документ подходит вашему бизнесу и актуальной редакции закона. Ответственность за использование документа несёт владелец сайта.
          </p>
        </Container>
      </Section>
    </>
  );
}
