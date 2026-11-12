import { site } from "@/lib/site";
import { Container, Section } from "./container";
import { Button } from "./ui/button";

export function Cta() {
  return (
    <Section className="hero border-t">
      <div className="hero-bg" aria-hidden="true"><div className="hero-glow" /></div>
      <Container className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Узнайте, что нейросети говорят о вашем бизнесе</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Запишитесь на бесплатную 30-минутную консультацию в Zoom или напишите в Telegram — разберём ваш бизнес и решим, с чего начать.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><a href={site.booking} target="_blank" rel="noopener">Записаться на консультацию</a></Button>
          <Button asChild size="lg" variant="outline"><a href={site.telegram} target="_blank" rel="noopener">Написать в Telegram</a></Button>
        </div>
      </Container>
    </Section>
  );
}
