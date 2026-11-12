import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { audit, services } from "@/lib/services";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { ServiceCard } from "@/components/service-card";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, faqSchema, graph } from "@/lib/schema";
import { offers, support } from "@/lib/offers";

const whom: Record<string, string> = {
  "personal-website": "Экспертам, предпринимателям и артистам: чтобы находили по имени",
  "corporate-website": "Бизнесам и стартапам: заявки из поиска и нейросетей",
  "content-factory": "Тем, у кого есть сайт, но блог не ведётся",
  "web-service-development": "Продуктам и командам: кабинет, админка, дашборды",
};

const hubFaq = [
  { q: "С чего начать, если нужен и личный, и корпоративный сайт?", a: `Взять оба сразу: вместе они стоят ${offers.bundle.price} вместо ${offers.bundle.oldPrice}. Сайты делаются в одном стиле и ссылаются друг на друга — нейросетям проще связать вас с компанией.` },
  { q: "Что входит в цену, кроме разработки?", a: `Спецификация, дизайн, разметка для нейросетей, запуск и первый год администрирования: отчёт каждый месяц и 2 итерации правок. Дальше администрирование — ${support.price}.` },
  { q: "Работаете по договору?", a: "Да. Я работаю как самозанятый: этапы, сроки и цена фиксируются в договоре до старта, на каждую оплату — чек из «Мой налог»." },
  { q: "Можно подключить контент-завод к уже готовому сайту?", a: "Да. Контент-завод работает с сайтами на коде, Tilda и WordPress: статьи выходят в ваш блог и дублируются в Telegram и Max." },
];


export const metadata: Metadata = {
  title: "Услуги: личный и корпоративный сайт, веб-сервис",
  description: "Личные и корпоративные сайты с продвижением в нейросетях, контент-завод для блога с UGC и веб-сервисы с личным кабинетом, админкой и дашбордами.",
  alternates: { canonical: "/services/" },
};

export default function Services() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "ItemList", name: "Услуги NikAlimp", itemListElement: services.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.title, url: `${site.url}/services/${s.slug}/` })) },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Услуги", path: "/services/" }]),
          faqSchema(hubFaq),
        )}
      />
      <Section className="pt-12">
        <Container>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">Услуги</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground text-center mx-auto">Четыре услуги, которые делаю сам и под ключ: сайт о вас, сайт о вашем бизнесе, блог, который ведётся без вас, и веб-сервис для клиентов и команды.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {services.map((s) => <ServiceCard key={s.slug} s={s} />)}
          </div>
          <Link href="/geo-audit/" className="card border-beam reveal group mt-12 flex flex-col gap-4 rounded-xl border border-brand/40 bg-brand-bg p-6 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-xl font-semibold">GEO-аудит: что нейросети говорят о вашем бизнесе</p>
              <p className="mt-1 text-muted-foreground">5 нейросетей, 20+ запросов, конкуренты, источники и план на 90 дней.</p>
            </div>
            <div className="sm:text-right">
              <p className="text-lg font-semibold">{audit.price}</p>
            </div>
            <ArrowRight className="hidden size-5 text-brand transition-transform group-hover:translate-x-1 sm:block" />
          </Link>
          <div className="mt-12">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Услуги в сравнении</h2>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground"><tr><th className="p-3 font-medium">Услуга</th><th className="p-3 font-medium">Кому</th><th className="p-3 font-medium">Цена</th><th className="p-3 font-medium">Срок</th></tr></thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.slug} className="border-t align-top">
                      <td className="p-3 font-medium"><Link href={`/services/${s.slug}/`} className="hover:text-brand">{s.title}</Link></td>
                      <td className="p-3 text-muted-foreground">{whom[s.slug]}</td>
                      <td className="p-3 whitespace-nowrap">{s.prices[0]?.value}</td>
                      <td className="p-3 text-muted-foreground">{s.timeline.split(/(?<=\.)\s/)[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-12 max-w-3xl">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Что входит в каждую услугу</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              <li><p className="font-medium">Спецификация до старта</p><p className="mt-1 text-sm text-muted-foreground">Страницы, тексты и функции фиксируем в документе, поэтому цена и срок известны заранее.</p></li>
              <li><p className="font-medium">Сайт для людей и нейросетей</p><p className="mt-1 text-sm text-muted-foreground">Весь текст в HTML, разметка Schema.org, llms.txt и доступ для AI-ботов — чтобы ChatGPT и Алиса понимали и советовали вас.</p></li>
              <li><p className="font-medium">Год администрирования</p><p className="mt-1 text-sm text-muted-foreground">Ежемесячные отчёты, новые инструменты и две итерации правок в год. Первый год входит в стоимость.</p></li>
              <li><p className="font-medium">Код и доступы — ваши</p><p className="mt-1 text-sm text-muted-foreground">Домен, хостинг, аналитика и репозиторий оформляются на вас, сайт можно передать любому разработчику.</p></li>
            </ul>
          </div>
          <div className="mt-12 max-w-3xl">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">Как выбрать услугу</h2>
            <p className="text-muted-foreground">Если нужно, чтобы вас находили как человека — эксперта, артиста или предпринимателя, — начните с личного сайта. Если речь о компании, продуктах и заявках — с корпоративного. Контент-завод подключается к любому сайту и приводит трафик из поиска и нейросетей. Веб-сервис — когда клиентам нужен личный кабинет, а команде — админка и дашборды. Не уверены, что нужно бизнесу, — начните с GEO-аудита.</p>
          </div>
          <div className="mt-12 max-w-3xl">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Частые вопросы</h2>
            <div className="divide-y rounded-xl border">
              {hubFaq.map((f) => (
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
