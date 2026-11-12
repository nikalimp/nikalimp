import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { Container } from "./container";
import { NavLink } from "./nav-link";
import { libraries, products } from "@/lib/products";

// Дата сборки: сайт пересобирается только при изменениях, поэтому это дата последнего обновления
const updated = new Date().toISOString().slice(0, 10);

export function Footer() {
  return (
    <footer className="border-t py-12 text-sm">
      <Container className="grid gap-8 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <p className="font-semibold">{site.name}</p>
          <p className="mt-2 text-muted-foreground">AEO, GEO, SEO, сайты и веб-сервисы</p>
          <p className="mt-4"><a href={site.telegram} target="_blank" rel="noopener" className="text-foreground underline underline-offset-4">Написать в Telegram</a></p>
          <ul className="mt-3 space-y-1.5 text-muted-foreground">
            <li><a href={`mailto:${site.email}`} className="hover:text-foreground">{site.email}</a></li>
            <li><a href={`tel:${site.phoneHref}`} className="hover:text-foreground">{site.phone}</a></li>
            <li><NavLink href="/contacts/" className="hover:text-foreground">Все контакты и реквизиты</NavLink></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium"><NavLink href="/services/" className="hover:underline">Услуги</NavLink></p>
          <ul className="space-y-1.5 text-muted-foreground">
            {services.map((s) => (
              <li key={s.slug}><NavLink href={`/services/${s.slug}/`} className="hover:text-foreground">{s.title}</NavLink></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium"><NavLink href="/products/" className="hover:underline">Продукты</NavLink></p>
          <ul className="space-y-1.5 text-muted-foreground">
            {products.map((p) => (
              <li key={p.href}><NavLink section href={p.href} className="hover:text-foreground">{p.label}</NavLink></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium"><NavLink href="/libraries/" className="hover:underline">Библиотеки</NavLink></p>
          <ul className="space-y-1.5 text-muted-foreground">
            {libraries.map((p) => (
              <li key={p.href}><NavLink section href={p.href} className="hover:text-foreground">{p.label}</NavLink></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium">Разделы</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><NavLink href="/#process" className="hover:text-foreground">Этапы работы</NavLink></li>
            <li><NavLink href="/methodology/" className="hover:text-foreground">Методика замеров</NavLink></li>
            <li><NavLink section href="/blog/" className="hover:text-foreground">Блог</NavLink></li>
            <li><NavLink section href="/digest/" className="hover:text-foreground">Дайджест</NavLink></li>
            <li><NavLink href="/cases/" className="hover:text-foreground">Кейсы</NavLink></li>
            <li><NavLink href="/partners/" className="hover:text-foreground">Партнёрская программа</NavLink></li>
            <li><a href="/llms.txt" className="hover:text-foreground">llms.txt</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium">Соцсети</p>
          <ul className="space-y-1.5 text-muted-foreground">
            {site.socials.map((s) => (
              <li key={s.href}><a href={s.href} target="_blank" rel="noopener me" className="hover:text-foreground">{s.label}</a></li>
            ))}
          </ul>
        </div>
      </Container>
      <Container className="mt-10 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} {site.person} · самозанятый, ИНН {site.legal.inn}</span>
        <span className="flex flex-wrap gap-x-3">
          <NavLink href="/privacy-policy/" className="hover:text-foreground">Политика конфиденциальности</NavLink>
          <NavLink href="/terms/" className="hover:text-foreground">Соглашение</NavLink>
          <span>Сайт обновлён <time dateTime={updated}>{updated.split("-").reverse().join(".")}</time></span>
        </span>
      </Container>
      <Container className="mt-2 text-xs text-muted-foreground">
        <span>{site.metaNote}</span>
      </Container>
    </footer>
  );
}
