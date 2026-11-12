import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Mail, Phone, Send } from "lucide-react";
import { site } from "@/lib/site";
import { cv } from "@/lib/cv";
import { Container, Eyebrow, Section } from "@/components/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph, orgId, personId } from "@/lib/schema";

const path = "/contacts/";
const answer = `${site.person} — AI-native сайты и продукты с продвижением в нейросетях. Быстрее всего ответ приходит в Telegram. Также можно написать на почту, позвонить или записаться на 30-минутную консультацию в Zoom. Работаю удалённо с бизнесом из России и СНГ.`;

const channels = [
  { icon: Send, title: "Telegram", value: "@nikalimp", href: site.telegram, note: "Самый быстрый способ связаться" },
  { icon: Mail, title: "Почта", value: site.email, href: `mailto:${site.email}`, note: "Для писем, брифов и документов" },
  { icon: Phone, title: "Телефон", value: site.phone, href: `tel:${site.phoneHref}`, note: "Звонки и мессенджеры" },
  { icon: CalendarDays, title: "Консультация", value: "30 минут в Zoom", href: site.booking, note: "Выберите удобное время в календаре" },
];

export const metadata: Metadata = {
  title: "Контакты — Никита Алимпиев (NikAlimp)",
  description: answer.slice(0, 160),
  alternates: { canonical: path },
};

export default function ContactsPage() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "ContactPage", name: "Контакты", url: `${site.url}${path}`, about: { "@id": orgId }, mainEntity: { "@id": personId } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Контакты", path }]),
        )}
      />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">Контакты</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-center mx-auto max-w-2xl">{answer}</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg"><a href={site.telegram} target="_blank" rel="noopener">Написать в Telegram</a></Button>
            <Button asChild size="lg" variant="outline"><a href={site.booking} target="_blank" rel="noopener">Записаться на консультацию</a></Button>
          </div>
        </Container>
      </Section>

      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <Eyebrow>Как связаться</Eyebrow>
          <ul className="grid gap-4 sm:grid-cols-2">
            {channels.map((c) => (
              <li key={c.title} className="flex gap-4 rounded-xl border bg-background p-5">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand"><c.icon className="size-4" /></span>
                <div className="min-w-0">
                  <p className="font-medium">{c.title}</p>
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener" className="mt-1 block break-all text-brand hover:underline">{c.value}</a>
                  <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="cv" className="scroll-mt-20 border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Резюме</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">{site.person} — {cv.role}</h2>
          <p className="mt-2 text-muted-foreground">{cv.tagline} · {cv.location}</p>
          {cv.about.map((t) => (
            <p key={t.slice(0, 24)} className="mt-4 leading-relaxed">{t}</p>
          ))}

          <h3 className="mt-10 text-lg font-semibold">Опыт</h3>
          <ol className="mt-4 divide-y rounded-xl border">
            {cv.experience.map((e) => (
              <li key={e.company + e.period} className="p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <p className="font-medium">{e.role} · {e.company}<span className="font-normal text-muted-foreground">, {e.place}</span></p>
                  <p className="shrink-0 text-sm tabular-nums text-muted-foreground">{e.period}</p>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {e.points.map((pt) => <li key={pt}>{pt}</li>)}
                </ul>
              </li>
            ))}
          </ol>

          <h3 className="mt-10 text-lg font-semibold">Клиенты</h3>
          <p className="mt-3 text-muted-foreground">{cv.clients.join(", ")}. Кейсы — на странице <Link href="/cases/" className="text-brand hover:underline">«Кейсы»</Link>.</p>

          <h3 className="mt-10 text-lg font-semibold">Навыки</h3>
          <dl className="mt-4 divide-y rounded-xl border text-sm">
            {cv.skills.map((g) => (
              <div key={g.group} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6"><dt className="w-48 shrink-0 text-muted-foreground">{g.group}</dt><dd>{g.items.join(", ")}</dd></div>
            ))}
          </dl>

          <h3 className="mt-10 text-lg font-semibold">Образование</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            {cv.education.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Реквизиты</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Кто работает с вами</h2>
          <dl className="mt-6 divide-y rounded-xl border text-sm">
            <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6"><dt className="w-40 shrink-0 text-muted-foreground">Исполнитель</dt><dd>{site.legal.name} ({site.name})</dd></div>
            <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6"><dt className="w-40 shrink-0 text-muted-foreground">Статус</dt><dd>Самозанятый, плательщик налога на профессиональный доход</dd></div>
            <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6"><dt className="w-40 shrink-0 text-muted-foreground">ИНН</dt><dd className="tabular-nums">{site.legal.inn}</dd></div>
            <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6"><dt className="w-40 shrink-0 text-muted-foreground">Документы</dt><dd>Договор оказания услуг, акт и чек из «Мой налог» после каждой оплаты</dd></div>
          </dl>
          <p className="mt-6 text-sm text-muted-foreground">
            <Link href="/privacy-policy/" className="hover:text-foreground hover:underline">Политика конфиденциальности</Link> · <Link href="/terms/" className="hover:text-foreground hover:underline">Пользовательское соглашение</Link>
          </p>
        </Container>
      </Section>
    </>
  );
}
