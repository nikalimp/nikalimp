import { Check } from "lucide-react";
import { Container, Eyebrow, Section } from "@/components/container";
import { deliverables, processAnswer, processSteps } from "@/lib/process";

/** Полные этапы работы (9 шагов: что делаю я, что нужно от вас, результат). Живёт на /services/#process — с главной перенесено 18.11.2026. */
export function ProcessSection() {
  return (
    <>
      
      <Section id="process" className="scroll-mt-14 border-t">
        <Container className="max-w-3xl">
          <Eyebrow>Этапы</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight">Как я делаю сайт: 9 этапов от брифа до запуска</h2>
          <p className="mt-4 text-muted-foreground">{processAnswer}</p>
          <p className="mt-2 text-sm text-muted-foreground">Сроки указаны для личного / корпоративного сайта.</p>
          <ol className="mt-10">
            {processSteps.map((st, i) => (
              <li key={st.title} id={`step-${i + 1}`} className="relative grid grid-cols-[2.5rem_1fr] gap-4 pb-10 last:pb-0 sm:gap-6">
                {i < processSteps.length - 1 && <span aria-hidden="true" className="absolute bottom-1 left-5 top-11 w-px -translate-x-1/2 bg-gradient-to-b from-brand/50 to-border" />}
                <span className="relative z-10 inline-flex size-10 items-center justify-center rounded-full border border-brand/40 bg-background font-mono text-sm text-brand">{String(i + 1).padStart(2, "0")}</span>
                <div className="pt-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg font-semibold">{st.title}</h3>
                    <span className="text-sm text-muted-foreground">{st.time}</span>
                  </div>
                  <p className="mt-2">{st.what}</p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border bg-background p-4">
                      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">От вас</dt>
                      <dd className="mt-1.5">{st.you}</dd>
                    </div>
                    <div className="rounded-lg border border-brand/30 bg-brand-bg p-4">
                      <dt className="font-mono text-[11px] uppercase tracking-wider text-brand">Результат</dt>
                      <dd className="mt-1.5">{st.result}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>

          <h3 className="mt-16 text-2xl font-semibold tracking-tight">Что вы получаете</h3>
          <ul className="mt-6 space-y-3">
            {deliverables.map((d) => <li key={d} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{d}</li>)}
          </ul>
        </Container>
      </Section>
    </>
  );
}
