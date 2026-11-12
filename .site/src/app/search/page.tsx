import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Container, Section } from "@/components/container";
import { SearchResults } from "@/components/search-results";

// Страница результатов: служебная, в индекс не идёт и в sitemap её нет.
// Нужна для «Все результаты» и для SearchAction в разметке WebSite.
export const metadata: Metadata = {
  title: "Поиск по сайту",
  description: "Поиск по услугам, глоссарию GEO, AEO и SEO, каталогу инструментов и статьям блога NikAlimp.",
  alternates: { canonical: "/search/" },
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <Section className="pt-12">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-center mx-auto max-w-3xl text-balance">Поиск по сайту</h1>
        <Suspense fallback={<div className="mt-8 h-12 rounded-lg border" />}>
          <SearchResults />
        </Suspense>
      </Container>
    </Section>
  );
}
