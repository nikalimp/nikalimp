import { metaDesc } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, FileSignature, Wallet, Repeat, Layers, TrendingUp, Clock } from "lucide-react";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";
import { PartnerCalculator } from "@/components/partner-calculator";
import { TIERS, calcReward, fmtPct, fmtRub, tierLabel } from "@/lib/partner";
import { breadcrumbs, faqSchema, graph, orgId } from "@/lib/schema";

const path = "/partners/";
const title = "Партнёрская программа";
const answer = `Рекомендуйте мои услуги — личные и корпоративные сайты, контент-завод и веб-сервисы — и получайте от 4 до 10 % с каждого оплаченного договора или услуги для себя стоимостью в 2 раза больше. Ставка растёт слоями, как прогрессивный налог: часть договора от 50 000 до 125 000 ₽ — 4 %, часть от 500 000 ₽ — 10 %. Подвиньте ползунок и посмотрите, сколько принесёт клиент.`;

const example = calcReward(300_000);

const steps = [
  { icon: Handshake, title: "Познакомьте", text: "Напишите мне в Telegram, кого и с какой задачей приводите, и представьте нас в общем чате или по почте. Я беру переговоры на себя." },
  { icon: FileSignature, title: "Клиент подписывает договор", text: "Фиксирую вас как партнёра по этому клиенту. Если клиент уже писал мне раньше, предупрежу сразу — такой договор в программу не входит." },
  { icon: Wallet, title: "Клиент платит — вы получаете", text: "После каждой оплаты клиента перевожу вашу долю за 5 рабочих дней. Считаю по оплаченной сумме, а не по подписанной." },
  { icon: Repeat, title: "Повторные договоры тоже ваши", text: "Все договоры с этим клиентом в течение 12 месяцев после знакомства идут в зачёт — каждый считается отдельно по той же шкале." },
];

const who = [
  "Веб-студиям и дизайнерам, к которым приходят за SEO и видимостью в нейросетях.",
  "Маркетологам и SMM-специалистам, чьим клиентам нужен сайт или GEO-продвижение.",
  "Бухгалтерам, юристам и консультантам с базой предпринимателей.",
  "Предпринимателям, которых спрашивают: «А кто тебе сайт делал?»",
];

const faq = [
  { q: "Почему ставка растёт слоями, а не целиком?", a: `Чтобы не было порогов, на которых договор за 126 000 ₽ выгоднее договора за 124 000 ₽. Каждая часть суммы оплачивается по своей ставке, и реальный процент растёт плавно: ${fmtPct(calcReward(150_000).effective)} при 150 000 ₽, ${fmtPct(example.effective)} при 300 000 ₽, ${fmtPct(calcReward(1_000_000).effective)} при 1 000 000 ₽.` },
  { q: "С какой суммы считается вознаграждение?", a: "С суммы, которую клиент оплатил по договору: аванс, этапы, абонементные платежи. Если договор на 200 000 ₽, а клиент оплатил пока 100 000 ₽ — считаю со 100 000 ₽ и доплачиваю после следующих оплат." },
  { q: "Как и когда выплачивается?", a: "Переводом на карту или счёт за 5 рабочих дней после каждой оплаты клиента. Я самозанятый, вы — физлицо, самозанятый, ИП или компания: формат документов обсуждаем при первом клиенте." },
  { q: "Нужно ли участвовать в проекте?", a: "Нет. Ваша роль заканчивается на знакомстве. Если хотите вести клиента вместе — обсуждаем отдельно, это уже не партнёрская программа, а субподряд." },
  { q: "Что если клиент уже писал вам раньше?", a: "Проверяю по переписке и CRM. Если клиент обращался ко мне до вашей рекомендации, договор с ним в программу не входит — скажу об этом сразу, до подписания." },
  { q: "Можно ли привести себя или свою компанию?", a: "Нет, программа — за знакомство с третьей стороной. Для своих проектов есть скидка за объём, напишите — посчитаем." },
  { q: "Какие услуги входят?", a: "Все услуги с сайта: личный и корпоративный сайт, контент-завод, веб-сервис, GEO-аудит и администрирование. Исключение — бесплатные продукты и консультации." },
  { q: "Можно получить услуги вместо денег?", a: "Да. Вместо выплаты я сделаю для вас работу стоимостью в 2 раза больше вознаграждения. Пара хороших рекомендаций — и ваш личный или корпоративный сайт становится бесплатным." },
];

export const metadata: Metadata = {
  title: "Партнёрская программа — от 4 до 10 % с договора",
  description: metaDesc(answer),
  alternates: { canonical: path },
  openGraph: { title, url: `${site.url}${path}` },
};

export default function PartnersPage() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "WebPage", name: title, description: answer, url: `${site.url}${path}`, inLanguage: "ru-RU", about: { "@id": orgId } },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: title, path }]),
          faqSchema(faq),
        )}
      />
      <Section className="hero pb-10 pt-12">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">Партнёрская программа: от 4 до 10 % с каждого договора</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-center mx-auto max-w-2xl">{answer}</p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg"><a href={site.telegram} target="_blank" rel="noopener">Стать партнёром</a></Button>
            <Button asChild size="lg" variant="outline"><Link href="/services/">Что рекомендовать</Link></Button>
          </div>
        </Container>
      </Section>

      <Section className="hero border-t bg-card pt-10">
        <Container className="max-w-6xl">
          <Eyebrow>Калькулятор</Eyebrow>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Сколько принесёт клиент</h2>
          <PartnerCalculator />
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Как считается</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Ставка растёт слоями</h2>
          <p className="mt-4 text-muted-foreground">Сумма договора делится на слои, и каждый слой оплачивается по своей ставке. Договор за {fmtRub(example.amount)} приносит {fmtRub(example.total)} — это {fmtPct(example.effective)}, хотя верхний слой считается по {fmtPct(8 / 100)}.</p>
          <div className="mt-8 overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-2.5 font-medium">Часть суммы договора</th><th className="px-4 py-2.5 text-right font-medium">Ставка</th><th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Пример: {fmtRub(example.amount)}</th></tr>
              </thead>
              <tbody className="divide-y">
                {TIERS.map((t, i) => (
                  <tr key={t.from}>
                    <td className="px-4 py-2.5 tabular-nums">{tierLabel(t)}</td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-brand">{fmtPct(t.rate)}</td>
                    <td className="hidden px-4 py-2.5 text-right tabular-nums text-muted-foreground sm:table-cell">{example.tiers[i].reward ? `${fmtRub(example.tiers[i].base)} × ${fmtPct(t.rate)} = ${fmtRub(example.tiers[i].reward)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-muted/40 font-medium">
                <tr><td className="px-4 py-2.5">Итого</td><td className="px-4 py-2.5 text-right tabular-nums">{fmtPct(example.effective)}</td><td className="hidden px-4 py-2.5 text-right tabular-nums sm:table-cell">{fmtRub(example.total)}</td></tr>
              </tfoot>
            </table>
          </div>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Layers, title: "Без порогов", text: "Договор на рубль больше не меняет ставку всей суммы — только нового слоя." },
              { icon: TrendingUp, title: "Крупный клиент — выше процент", text: `Договор на 1 000 000 ₽ приносит ${fmtRub(calcReward(1_000_000).total)}.` },
              { icon: Clock, title: "Выплата после оплаты", text: "За 5 рабочих дней после каждого платежа клиента." },
            ].map((c) => (
              <li key={c.title} className="flex gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand"><c.icon className="size-4" /></span>
                <div><p className="font-medium">{c.title}</p><p className="mt-1 text-sm text-muted-foreground">{c.text}</p></div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="border-t bg-card">
        <Container className="max-w-3xl">
          <Eyebrow>Как это работает</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Четыре шага от знакомства до выплаты</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-xl border bg-background p-5">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand"><s.icon className="size-4" /></span>
                <div>
                  <p className="font-medium"><span className="mr-2 font-mono text-xs text-muted-foreground">0{i + 1}</span>{s.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Кому подходит</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Кто обычно рекомендует</h2>
          <ul className="mt-6 space-y-3 text-muted-foreground">
            {who.map((w) => <li key={w} className="flex gap-3"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />{w}</li>)}
          </ul>
          <p className="mt-6 text-muted-foreground">Что именно рекомендовать — на странице <Link href="/services/" className="text-foreground underline underline-offset-4">услуг</Link>: там цены, сроки и состав работ. Клиенту можно сразу отправить бесплатную <Link href="/geo-audit/" className="text-foreground underline underline-offset-4">экспресс-проверку</Link> — так разговор начинается с цифр.</p>
        </Container>
      </Section>

      <Section className="border-t">
        <Container className="max-w-3xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Вопросы о партнёрской программе</h2>
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

      <Section className="hero border-t">
        <div className="hero-bg" aria-hidden="true"><div className="hero-glow" /></div>
        <Container className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Есть кому порекомендовать?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Напишите в Telegram, кого приводите, — отвечу в тот же день и зафиксирую вас партнёром по этому клиенту.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><a href={site.telegram} target="_blank" rel="noopener">Стать партнёром</a></Button>
            <Button asChild size="lg" variant="outline"><a href={`mailto:${site.email}`}>Написать на почту</a></Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
