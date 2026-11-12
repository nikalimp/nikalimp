import { metaDesc } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { FileSignature, Receipt, ShieldCheck, Stamp, MessageSquareText, FolderLock } from "lucide-react";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { ContractGenerator } from "@/components/contract-generator";
import { breadcrumbs, faqSchema, graph, orgId } from "@/lib/schema";

const path = "/contract-generator/";
const title = "Генератор договора оказания услуг";
const answer = `Генератор собирает договор возмездного оказания услуг и акт к нему за 10 минут. Выберите тип услуг — разработка сайта, продвижение, дизайн, реклама или консультации, — заполните стороны и оплату, и документ обновится сразу. Готовый текст копируется в Word или Google Docs и скачивается в DOCX или PDF. Бесплатно и без регистрации, данные остаются в вашем браузере.`;

const checklist = [
  { icon: FileSignature, title: "Проверьте предмет", text: "Чем точнее список работ в пункте 1.2, тем меньше споров о том, что входило в цену. Всё остальное — допсоглашением." },
  { icon: ShieldCheck, title: "Гарантируйте объём, а не результат", text: "Позиции в поиске, упоминания в нейросетях и продажи зависят от сторонних сервисов. Пункт об этом включается одним переключателем." },
  { icon: Stamp, title: "Подпишите акт", text: "Акт закрывает этап и запускает оплату. Если заказчик молчит дольше срока приёмки, услуги считаются принятыми." },
  { icon: Receipt, title: "Выдайте чек, если вы самозанятый", text: "После каждой оплаты сформируйте чек в «Мой налог» и отправьте заказчику — генератор добавляет этот пункт сам." },
  { icon: MessageSquareText, title: "Договоритесь о переписке", text: "Пункт об электронной переписке позволяет согласовывать правки и акты в почте и мессенджерах без бумажных писем." },
  { icon: FolderLock, title: "Передайте права", text: "Для сайта и дизайна включите переход исключительных прав после оплаты: так заказчик сможет свободно пользоваться результатом." },
];

const faq = [
  { q: "Чем договор оказания услуг отличается от договора подряда?", a: "По договору оказания услуг платят за действия исполнителя: консультации, продвижение, ведение рекламы (глава 39 ГК РФ). По договору подряда — за овеществлённый результат. Для фрилансеров и студий договор оказания услуг удобнее: в нём проще описать абонемент и почасовую оплату." },
  { q: "Можно ли заключить договор с самозанятым?", a: "Да. Выберите «Самозанятый» в блоке исполнителя: генератор уберёт НДС, добавит пункт о чеке из «Мой налог» и не будет запрашивать ОГРН." },
  { q: "Почему исполнитель не гарантирует позиции и продажи?", a: "Позиции в Яндексе и Google, упоминания в ответах ChatGPT и Алисы, модерация площадок зависят от алгоритмов третьих лиц. Исполнитель отвечает за объём и качество своей работы, поэтому в договор включается пункт о том, что отсутствие таких результатов не считается недостатком услуг." },
  { q: "Как оформить абонемент?", a: "Выберите модель оплаты «Абонемент»: в договоре появятся отчётный период, оплата авансом, минимальный срок и ежемесячный акт с отчётом." },
  { q: "Подходит ли договор для работы с физлицом?", a: "Да, но если заказчик — физлицо и заказывает услуги для личных нужд, к договору применяется закон о защите прав потребителей. Ограничение ответственности в этом случае генератор не добавляет, а споры решаются с учётом прав потребителя." },
  { q: "Можно ли использовать договор без юриста?", a: "Для типовых услуг фрилансера, студии или агентства — как основу, да. Если сумма большая, есть иностранная сторона, работа с персональными данными клиентов или особые условия, покажите договор юристу." },
  { q: "Где хранятся данные, которые я ввожу?", a: "Только в вашем браузере. Генератор работает без сервера: ничего не отправляется, черновик сохраняется сам — закройте вкладку, и при следующем визите форма будет заполнена. Кнопка «Начать заново» очищает её." },
  { q: "Как скачать договор в Word или PDF?", a: "Кнопка «Скачать DOCX» сохраняет файл для Word, Google Docs и Pages: шрифт Times New Roman 12 pt, таблица реквизитов на месте. Кнопка «Скачать PDF» открывает окно печати — выберите в нём «Сохранить как PDF». В файл попадает только договор или акт, без меню сайта." },
];

export const metadata: Metadata = {
  title: "Генератор договора оказания услуг онлайн — бесплатно",
  description: metaDesc(answer),
  alternates: { canonical: path },
  openGraph: { title, url: `${site.url}${path}` },
};

export default function ContractGeneratorPage() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "WebApplication", name: title, description: answer, url: `${site.url}${path}`, applicationCategory: "BusinessApplication", operatingSystem: "Any", inLanguage: "ru-RU", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" }, provider: { "@id": orgId } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Генератор договора", path }]),
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
          <ContractGenerator />
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Перед подписанием</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Что проверить в договоре</h2>
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
          <h2 className="text-2xl font-semibold tracking-tight">Вопросы о договоре оказания услуг</h2>
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
            Генератор предоставляется «как есть». Шаблон составлен по главе 39 Гражданского кодекса РФ «Возмездное оказание услуг», но не заменяет консультацию юриста: проверьте, что документ подходит вашей сделке и актуальной редакции закона. Ответственность за использование документа несут стороны договора.
          </p>
        </Container>
      </Section>
    </>
  );
}
