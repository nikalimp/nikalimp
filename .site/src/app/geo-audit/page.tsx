import { metaDesc } from "@/lib/utils";
import type { Metadata } from "next";
import { audit } from "@/lib/services";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Bot, FileCode2, Gift, ShieldCheck, Zap } from "lucide-react";
import { AuditTool } from "@/components/audit-tool";
import { AiAsk } from "@/components/ai-ask";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, faqSchema, graph, orgId } from "@/lib/schema";

const answer = `GEO-аудит показывает, что ChatGPT, Алиса AI, GigaChat, Perplexity и DeepSeek отвечают о вашем бизнесе и конкурентах по 20+ запросам, на какие источники они опираются и что мешает им вас рекомендовать. Результат — отчёт с оценкой и планом на 90 дней. Срок — 3⁠–⁠5 рабочих дней. Перед стартом работ аудит бесплатный, отдельно — от 9 900 ₽.`;

const tool = [
  { icon: Bot, title: "Доступ для нейросетей", text: "Захожу на страницу как GPTBot, ClaudeBot, PerplexityBot и YandexBot: пускает ли сервер, открыт ли robots.txt, виден ли текст без JavaScript, есть ли llms.txt и карта сайта." },
  { icon: FileCode2, title: "Ответы, которые удобно цитировать", text: "Прямой ответ в первом абзаце, заголовки-вопросы, FAQ с разметкой, списки и таблицы, объём текста." },
  { icon: ShieldCheck, title: "Кто вы: сущность и доверие", text: "Разметка Organization или Person, ссылки sameAs на карты и соцсети, контакты, автор и даты обновления." },
];

const faq = [
  { q: "Чем бесплатная GEO-проверка отличается от GEO-аудита?", a: "Проверка за минуту смотрит на сайт: пускает ли он ботов нейросетей и удобно ли его цитировать. Аудит смотрит на ответы: что ChatGPT, Алиса AI, GigaChat, Perplexity и DeepSeek говорят о вас и конкурентах по 20+ запросам и на какие источники опираются." },
  { q: "Почему нельзя автоматически узнать, что нейросети отвечают обо мне?", a: "Ответы зависят от формулировки, города и истории чата, а API нейросетей платные. Поэтому ниже есть ручная проверка: запросы открываются в ChatGPT, Алисе AI, Perplexity и других одной кнопкой. Для регулярного замера по 20+ запросам нужен аудит." },
  { q: "Можно сначала проверить бесплатно и без созвона?", a: `Да — экспресс-проверка: ${audit.express.text} Срок — ${audit.express.days}.` },
  { q: "Почему аудит бесплатный?", a: "Это первый шаг перед работой: я смотрю на ваш бизнес глазами нейросетей, вы получаете отчёт и план, а дальше решаем, нужна ли моя помощь. Если нужен только отчёт без дальнейшей работы — аудит стоит от 9 900 ₽." },
  { q: "Что нужно от меня для аудита?", a: "Сайт, ссылки на соцсети и Telegram, короткое описание услуг и города, 3⁠–⁠5 конкурентов и запросы, по которым вы хотите быть в ответах нейросетей." },
  { q: "Что я получу?", a: "Отчёт: оценку по 5 блокам (присутствие в ответах, источники, техника сайта, контент, внешние сигналы), скриншоты ответов нейросетей, топ-10 проблем и план на 90 дней." },
  { q: "Можно сделать план самому после аудита?", a: "Да. План написан так, чтобы его мог выполнить ваш маркетолог или разработчик. Если нужно — сделаю сам по абонементу GEO + AEO + SEO." },
];

export const metadata: Metadata = {
  title: "GEO-аудит сайта онлайн: готов ли сайт к нейросетям",
  description: "Бесплатная GEO-проверка за минуту: пускает ли сайт ботов ChatGPT, Claude, Perplexity и Алисы, удобно ли его цитировать. И полный GEO-аудит с замером ответов.",
  alternates: { canonical: "/geo-audit/" },
};

export default function AuditPage() {
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "WebApplication", name: "GEO-проверка сайта", url: `${site.url}/geo-audit/`, applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "ru-RU", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" }, author: { "@type": "Person", name: site.person } },
          { "@type": "Service", name: "GEO-аудит", description: answer, url: `${site.url}/geo-audit/`, provider: { "@id": orgId }, offers: [{ "@type": "Offer", name: "GEO-проверка сайта онлайн", price: "0", priceCurrency: "RUB" }, { "@type": "Offer", name: "Экспресс-проверка: 5 запросов в 4 нейросетях", price: "0", priceCurrency: "RUB" }, { "@type": "Offer", name: "GEO-аудит перед стартом работ", price: "0", priceCurrency: "RUB" }, { "@type": "Offer", name: "GEO-аудит отдельно", price: "9900", priceCurrency: "RUB" }] },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "GEO-аудит", path: "/geo-audit/" }]),
          faqSchema(faq),
        )}
      />
      <Section className="pt-12">
        <Container>
          <h1 className="mx-auto max-w-3xl text-balance text-center text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">GEO-аудит: готов ли сайт к ответам нейросетей</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground print:hidden">Проверю страницу так, как её читают ChatGPT, Claude, Perplexity и Алиса AI: пускает ли сервер их ботов, видят ли они текст и удобно ли его цитировать. Бесплатно, за минуту.</p>
          <div className="mx-auto mt-10 max-w-4xl"><AuditTool mode="geo" /></div>
        </Container>
      </Section>

      <Section className="border-t bg-card print:hidden">
        <Container className="max-w-4xl">
          <Eyebrow>Ручная проверка</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Что нейросети отвечают о вас</h2>
          <p className="mt-3 text-muted-foreground">Напишите, чем вы занимаетесь, — соберу три запроса, какие задают клиенты. Каждый открывается в нейросети одной кнопкой, ответ видите сразу.</p>
          <div className="mt-6"><AiAsk /></div>
        </Container>
      </Section>

      <Section className="border-t print:hidden">
        <Container className="max-w-4xl">
          <Eyebrow>Что проверяем</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Три блока GEO-проверки</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {tool.map((t) => (
              <li key={t.title} className="card rounded-xl border p-5">
                <span className="card-icon inline-flex size-9 items-center justify-center rounded-lg bg-brand-bg text-brand"><t.icon className="size-4" /></span>
                <p className="mt-3 font-medium">{t.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="full-audit" className="scroll-mt-20 border-t bg-card print:hidden">
        <Container className="max-w-3xl">
          <Eyebrow>Полный GEO-аудит</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight">Что нейросети говорят о вашем бизнесе</h2>
          <p className="mt-3 text-muted-foreground">{answer}</p>
          <div className="mt-8 flex flex-col gap-4 rounded-xl border bg-background p-6 sm:flex-row sm:items-start">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand"><Zap className="size-5" /></span>
            <div>
              <p className="text-xl font-semibold">{audit.express.title} — {audit.express.price}</p>
              <p className="mt-2 text-muted-foreground">{audit.express.text} Срок — {audit.express.days}.</p>
              <Button asChild className="mt-4"><a href={site.telegram} target="_blank" rel="noopener">Заказать экспресс-проверку</a></Button>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-brand/40 bg-brand-bg p-6 sm:flex-row sm:items-start">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-brand"><Gift className="size-5" /></span>
            <div>
              <p className="text-xl font-semibold">Бесплатный старт</p>
              <p className="mt-2 text-muted-foreground">Аудит — первый шаг перед работой, поэтому для всех, кто планирует начать, он бесплатный. Вы получаете полный отчёт и план на 90 дней и сами решаете, что дальше: внедрить план своими силами или со мной. Если нужен только отчёт, без старта работ, — {audit.price}.</p>
              <Button asChild variant="outline" className="mt-4"><a href={site.telegram} target="_blank" rel="noopener">Заказать аудит в Telegram</a></Button>
            </div>
          </div>
          <h3 className="mt-12 text-lg font-semibold">Что входит в аудит</h3>
          <ol className="mt-4 space-y-6">
            {audit.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="font-mono text-sm text-brand">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="border-t print:hidden">
        <Container className="max-w-3xl">
          <Eyebrow>Вопросы</Eyebrow>
          <div className="space-y-6">
            {faq.map((f) => (
              <div key={f.q}>
                <h2 className="font-medium">{f.q}</h2>
                <p className="mt-1.5 text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
