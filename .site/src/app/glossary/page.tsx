import type { Metadata } from "next";
import Link from "next/link";
import { getLetters, getTerms } from "@/lib/glossary";
import { site } from "@/lib/site";
import { Container, Section } from "@/components/container";

// Направления оптимизации — витрина над алфавитом
const disciplines = [
  { label: "GEO", slug: "geo", text: "Рекомендации бизнеса в ответах нейросетей" },
  { label: "AEO", slug: "aeo", text: "Быстрые ответы поиска и голосовых помощников" },
  { label: "SEO", slug: "seo", text: "Позиции сайта в Яндексе и Google" },
  { label: "LLMO", slug: "llmo", text: "Оптимизация под языковые модели, почти синоним GEO" },
  { label: "AIO", slug: "aio", text: "Присутствие в AI-поиске, термин пока неоднозначный" },
  { label: "SXO", slug: "sxo", text: "SEO плюс удобство пользовательского опыта" },
  { label: "CRO", slug: "cro", text: "Больше посетителей совершают целевое действие" },
  { label: "SERM", slug: "serm", text: "Репутация бренда в поисковой выдаче" },
  { label: "Local SEO", slug: "lokalnoe-seo", text: "Продвижение в картах и локальном поиске" },
  { label: "ASO", slug: "aso", text: "Продвижение приложений в App Store и Google Play" },
  { label: "VSO", slug: "optimizatsiya-pod-golosovoy-poisk", text: "Оптимизация под голосовой поиск" },
  { label: "Video SEO", slug: "video-seo", text: "Видео в поиске и рекомендациях" },
  { label: "YouTube SEO", slug: "youtube-seo", text: "Ролики в поиске и рекомендациях YouTube" },
  { label: "Image SEO", slug: "image-seo", text: "Изображения в визуальном поиске" },
  { label: "SMO", slug: "smo", text: "Контент и профили для соцсетей" },
  { label: "Marketplace SEO", slug: "seo-dlya-marketpleysov", text: "Карточки товаров внутри маркетплейсов" },
];
import { Cta } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, graph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Глоссарий GEO, AEO и SEO: термины простыми словами",
  description: "Словарь терминов GEO, AEO, SEO, веб-разработки и дизайна: что такое llms.txt, AI Overviews, query fan-out, AI-краулеры и другие понятия.",
  alternates: { canonical: "/glossary/" },
};

export default function Glossary() {
  const terms = getTerms();
  const letters = getLetters();
  const groups = letters.filter((l) => l.active).map((l, i) => ({ ...l, id: `l${i}`, items: terms.filter((t) => t.letter === l.letter) }));
  const slugs = new Set(terms.map((t) => t.slug));
  const idOf = new Map(groups.map((g) => [g.letter, g.id]));
  return (
    <>
      <JsonLd
        data={graph(
          { "@type": "DefinedTermSet", "@id": `${site.url}/glossary/#set`, name: "Глоссарий NikAlimp", url: `${site.url}/glossary/`, inLanguage: "ru-RU", hasDefinedTerm: terms.map((t) => ({ "@type": "DefinedTerm", name: t.term, url: `${site.url}/glossary/${t.slug}/` })) },
          breadcrumbs([{ name: "Главная", path: "/" }, { name: "Глоссарий", path: "/glossary/" }]),
        )}
      />
      <Section className="pt-12">
        <Container>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">Термины GEO, AEO и SEO простыми словами</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-center mx-auto">Словарь продвижения в нейросетях и поиске, веб-разработки и дизайна. Каждое определение начинается с короткого ответа, дальше — детали и связанные понятия. Сейчас в словаре {terms.length} терминов, он пополняется.</p>
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Направления оптимизации</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {disciplines.filter((d) => slugs.has(d.slug)).map((d) => (
                <li key={d.slug}>
                  <Link href={`/glossary/${d.slug}/`} className="card group block h-full rounded-lg border p-3 hover:bg-accent">
                    <span className="font-mono text-sm font-semibold text-brand">{d.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{d.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <nav aria-label="Алфавит" className="sticky top-14 z-10 -mx-4 mt-8 flex flex-wrap gap-1 border-y bg-background/90 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
            {letters.map((l) =>
              l.active ? (
                <a key={l.letter} href={`#${idOf.get(l.letter)}`} className="inline-flex size-8 items-center justify-center rounded-md font-mono text-sm hover:bg-accent">{l.letter}</a>
              ) : (
                <span key={l.letter} className="inline-flex size-8 items-center justify-center font-mono text-sm text-muted-foreground/40">{l.letter}</span>
              ),
            )}
          </nav>
          <div className="mt-6 space-y-12">
            {groups.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-32">
                <h2 className="mb-4 font-mono text-2xl font-semibold">{g.letter}</h2>
                <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {g.items.map((t) => (
                    <li key={t.slug}>
                      <Link href={`/glossary/${t.slug}/`} className="group block">
                        <span className="font-medium group-hover:underline group-hover:underline-offset-4">{t.term}</span>
                        {t.en && t.en !== t.term && <span className="ml-2 text-sm text-muted-foreground">{t.en}</span>}
                        <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{t.short}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
