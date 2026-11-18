import { site } from "@/lib/site";
import type { LeadOfferId } from "@/lib/lead-offers";
import { Container, Section } from "./container";
import { LeadForm } from "./lead-form";

/** Нижний блок каждой страницы: форма заявки с оффером под тип страницы (18.11.2026; раньше — две кнопки во внешние сервисы). */
export function Cta({ offer = "site", siteUrl, center = false }: { offer?: LeadOfferId; siteUrl?: string; center?: boolean }) {
  return (
    <Section id="lead" className="hero scroll-mt-14 border-t">
      <div className="hero-bg" aria-hidden="true"><div className="hero-glow" /></div>
      <Container className="max-w-3xl">
        <LeadForm offer={offer} siteUrl={siteUrl} center={center} />
        <p className={`mt-6 text-sm text-muted-foreground ${center ? "text-center" : ""}`}>Удобнее голосом? <a href={site.booking} target="_blank" rel="noopener" className="underline underline-offset-4">Запишитесь на 30 минут в Zoom</a> — разберём задачу и решим, с чего начать.</p>
      </Container>
    </Section>
  );
}
