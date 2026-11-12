import type { Metadata } from "next";
import { metaTitle } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { audit } from "@/lib/services";
import { products } from "@/lib/products";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, faqSchema, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: metaTitle("Продукты: GEO-аудит, семантика, инструменты и генераторы"),
  description: "GEO-аудит видимости в нейросетях и бесплатные инструменты: сбор семантики, генераторы политики конфиденциальности, договора, UTM-меток и QR-кода.",
  alternates: { canonical: "/products/" },
};

const productsFaq = [
  { q: "Инструменты правда бесплатные?", a: "Да, без регистрации, подписки и лимитов. Я делаю их для себя и клиентов и открываю всем — так проще показать, как я работаю." },
  { q: "Куда уходят мои данные?", a: "Генераторы считают всё в вашем браузере, реквизиты и запросы никуда не уходят. Аудиты получают только адрес сайта, который вы проверяете." },
  { q: "Чем GEO-аудит отличается от бесплатных инструментов?", a: "Инструмент решает одну задачу за минуту. GEO-аудит — работа на 3⁠–⁠5 рабочих дней: замер в 5 нейросетях по 20+ запросам, конкуренты, источники и план на 90 дней." },
  { q: "Можно предложить новый инструмент?", a: "Да, напишите в Telegram, какую рутину хочется автоматизировать. Если задача частая, сделаю генератор и добавлю его сюда." },
];

const groups = [
  { id: "audit", title: "Аудиты сайта", text: "Проверка за минуту: что мешает сайту в поиске и как его видят роботы." },
  { id: "marketing", title: "Семантика и маркетинг", text: "Запросы для структуры сайта, ссылки с метками для рекламы и QR-коды для офлайна." },
  { id: "docs", title: "Документы для сайта", text: "Политика конфиденциальности по 152-ФЗ и договор с актом — по шаблону, который можно отдать юристу." },
] as const;

export default function Products() {
  const [main, ...free] = products;
  const MainIcon = main.icon;
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "ItemList", name: "Продукты NikAlimp", itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${site.url}${p.href}` })) },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Продукты", path: "/products/" }]),
          faqSchema(productsFaq),
        )}
      />
      <Section className="pt-12">
        <Container>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">Продукты</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground text-center mx-auto">Готовые решения, которые можно взять без долгого проекта: аудит видимости в нейросетях и бесплатные инструменты для тех, кто делает и продвигает сайты.</p>

          <a href={main.href} className="card border-beam reveal group mt-10 flex flex-col gap-4 rounded-xl border border-brand/40 bg-brand-bg p-6 sm:flex-row sm:items-center">
            <span className="card-icon hidden size-10 shrink-0 items-center justify-center rounded-lg bg-background text-brand sm:inline-flex"><MainIcon className="size-5" /></span>
            <div className="flex-1">
              <p className="text-xl font-semibold">{main.title}</p>
              <p className="mt-1 text-muted-foreground">{main.about}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-lg font-semibold">Проверка бесплатно</p>
              <p className="text-sm text-muted-foreground">аудит {audit.price} · {audit.days}</p>
            </div>
            <ArrowRight className="hidden size-5 text-brand transition-transform group-hover:translate-x-1 sm:block" />
          </a>

          {groups.map((g) => (
            <section key={g.id} className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">{g.title}</h2>
              <p className="mt-1 mb-4 text-muted-foreground">{g.text}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {free.filter((p) => p.group === g.id).map((p) => {
                  const Icon = p.icon;
                  return (
                    <a key={p.href} href={p.href} className="card group flex items-start gap-4 rounded-xl border p-6 hover:bg-accent">
                      <span className="card-icon inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand"><Icon className="size-5" /></span>
                      <div className="flex-1">
                        <p className="font-semibold">{p.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{p.about}</p>
                      </div>
                      <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </a>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="mt-12 max-w-3xl">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">Чем продукты отличаются от услуг</h2>
            <p className="text-muted-foreground">Продукт — это готовый результат с понятной ценой и сроком: открыли и пользуетесь или заказали аудит и через несколько дней получили отчёт. <a href="/services/" className="text-foreground underline underline-offset-4">Услуги</a> — это работа под ваш бизнес: продвижение, разработка сайта или сервиса. Обычно всё начинается с GEO-аудита: он показывает, какая услуга нужна на самом деле.</p>
          </div>
          <div className="mt-12 max-w-3xl">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">Как устроены бесплатные инструменты</h2>
            <p className="text-muted-foreground">Генераторы и семантика работают прямо в браузере: запросы из Вордстата, ссылки, реквизиты для договора и картинка для QR-кода никуда не отправляются. Аудитам нужен сервер — он открывает ваш сайт как поисковый робот и хранит отчёт полчаса, чтобы не проверять одно и то же дважды. Регистрация не нужна. Результат можно забрать с собой: семантику — в Excel, QR-код — в SVG, PNG и JPEG, договор — в Word и PDF, отчёт аудита — в PDF.</p>
          </div>
          <div className="mt-12 max-w-3xl">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Частые вопросы</h2>
            <div className="divide-y rounded-xl border">
              {productsFaq.map((f) => (
                <details key={f.q} className="group p-4">
                  <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
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
