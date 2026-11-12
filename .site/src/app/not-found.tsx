import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <Section>
      <Container className="max-w-xl text-center">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Страница не найдена</h1>
        <Button asChild className="mt-6"><Link href="/">На главную</Link></Button>
      </Container>
    </Section>
  );
}
