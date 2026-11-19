import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { Container, Eyebrow, Section } from "@/components/container";
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph, personId } from "@/lib/schema";
import { cases, casesCount } from "@/lib/cases";
import { ProjectList } from "@/components/project-list";
import { getCaseStudies } from "@/lib/case-studies";
import { CaseCard } from "@/components/case-card";
import { StoryCarousel } from "@/components/story-carousel";
import { story } from "@/lib/story";

export const metadata: Metadata = {
  title: `Кейсы: ${casesCount} проектов с 2021 года — ${site.person}`,
  description: `Сайты, продукты и прототипы для стартапов, венчурных фондов и бизнеса из 9 стран: ${casesCount} проектов с 2021 года. Опыт и путь ${site.person}.`,
  alternates: { canonical: "/cases/" },
};

export default function Cases() {
  return (
    <>
      <JsonLd data={graph({ "@type": "ProfilePage", mainEntity: { "@id": personId } }, breadcrumbs([{ name: "Главная", path: "/" }, { name: "Кейсы", path: "/cases/" }]))} />
      <Section className="pt-12">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">Кейсы</h1>
          <p className="mt-2 text-muted-foreground text-center mx-auto max-w-2xl">{site.person} · Product Designer & Builder · GEO · AEO</p>
          <div className="prose-site mt-8">
            <p>Я делаю так, чтобы нейросети рекомендовали бизнес клиентам: продвигаю сайты и Telegram-каналы в ответах ChatGPT, Алисы AI, GigaChat и Perplexity, а ещё проектирую и разрабатываю сайты и веб-сервисы, которые ИИ понимает и цитирует.</p>
          </div>

          {getCaseStudies().length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold tracking-tight">Подробные кейсы</h2>
              <p className="mt-2 text-muted-foreground">Задача, решения, этапы и результат — на отдельных страницах.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">{getCaseStudies().map((c) => <CaseCard key={c.slug} c={c} />)}</div>
            </div>
          )}
          <div className="prose-site mt-12">
            <h2>Опыт</h2>
            <ul>
              <li><strong>Больше 100 сайтов с {site.since} года</strong> — на Tilda, Webflow и в коде, для бизнеса, экспертов и стартапов.</li>
              <li><strong>Фаундер facebase</strong> — B2B-платформы инфлюенс-маркетинга для российского рынка: бренды, блогеры и агентства. Проектировал кабинеты, админку и онбординг.</li>
              <li><strong>AI-native процесс</strong> — проектирую и пишу код вместе с ИИ-агентами. Поэтому один человек делает объём небольшой студии.</li>
            </ul>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight">Проекты</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{casesCount} проектов с 2021 года: сайты, продукты и прототипы. Часть работ под NDA — название и детали раскрыть не могу. Подробные разборы — в карточках выше.</p>
          {cases.map((y) => <ProjectList key={y.year} year={y.year} items={y.items} />)}


        </Container>
      </Section>
      {/* История по годам — перенесена с главной 18.11.2026 */}
      <Section id="story" className="scroll-mt-14 overflow-hidden border-t bg-card">
        <Container>
          <Eyebrow>Моя история</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">Умение адаптироваться — главный навык</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Каждый год я меняю страну и совершенствую свои навыки: от преподавателя акробатики в Екатеринбурге до работы с лидерами мнений и стартапами в сфере MarTech.</p>
          <StoryCarousel steps={story} />
        </Container>
      </Section>
      <Cta />
    </>
  );
}
