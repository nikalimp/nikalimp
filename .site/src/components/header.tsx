import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { Container } from "./container";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { SiteSearch } from "./site-search";
import { NavLink } from "./nav-link";
import { TelegramButton } from "./telegram-button";
import { libraries, products, type Product } from "@/lib/products";


const nav = [
  { href: "/cases/", label: "Кейсы" },
  { href: "/blog/", label: "Блог" },
  { href: "/contacts/", label: "Контакты", wide: true }, // на планшетах не влезает — только в мобильном меню и подвале
]

// Дропдаун на CSS (hover + focus-within): работает и без JavaScript.
function ServicesMenu() {
  return (
    <div className="group relative">
      <NavLink href="/services/" section className="inline-flex items-center gap-1 py-4 hover:text-foreground group-focus-within:text-foreground group-hover:text-foreground">
        Услуги <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
      </NavLink>
      <div className="invisible absolute left-1/2 top-full z-50 w-[min(340px,90vw)] -translate-x-1/2 pt-1 translate-y-1.5 opacity-0 transition-[opacity,translate,visibility] duration-200 ease-out group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
        <ul className="grid gap-1 rounded-xl border bg-background p-2 shadow-lg">
          {services.map((s) => (
            <li key={s.slug}>
              <NavLink href={`/services/${s.slug}/`} className="block rounded-md px-3 py-2 hover:bg-accent">
                <span className="block font-medium text-foreground">{s.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{s.short}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ListMenu({ label, href, items }: { label: string; href: string; items: Product[] }) {
  return (
    <div className="group relative">
      <NavLink href={href} section also={items.map((p) => p.href)} className="inline-flex items-center gap-1 py-4 hover:text-foreground group-focus-within:text-foreground group-hover:text-foreground">
        {label} <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
      </NavLink>
      <div className="invisible absolute left-1/2 top-full z-50 w-[min(340px,90vw)] -translate-x-1/2 pt-1 translate-y-1.5 opacity-0 transition-[opacity,translate,visibility] duration-200 ease-out group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
        <ul className="space-y-1 rounded-xl border bg-background p-3 shadow-lg">
          {items.map((p) => (
            <li key={p.href}>
              <NavLink href={p.href} section className="group/p block rounded-md px-3 py-2 hover:bg-accent">
                <span className="block text-foreground group-[.nav-active]/p:text-brand">{p.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{p.text}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Бургер-меню для мобильных: <details> открывается без JavaScript, ссылки — обычные <a>, страница перезагружается и меню закрывается.
function MobileMenu() {
  return (
    <details className="group/m md:hidden">
      <summary aria-label="Открыть меню" className="inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-md hover:bg-accent [&::-webkit-details-marker]:hidden">
        <Menu className="size-5 group-open/m:hidden" />
        <X className="hidden size-5 group-open/m:block" />
      </summary>
      <div className="absolute inset-x-0 top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b bg-background px-4 pb-6 pt-2 shadow-lg">
        <div className="border-b py-3">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Услуги</p>
          <ul>
            {services.map((s) => (
              <li key={s.slug}><NavLink reload href={`/services/${s.slug}/`} className="block py-2 text-[15px]">{s.title}</NavLink></li>
            ))}
          </ul>
        </div>
        <div className="border-b py-3">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Продукты</p>
          <ul>
            {products.map((p) => <li key={p.href}><NavLink reload section href={p.href} className="block py-2 text-[15px]">{p.label}</NavLink></li>)}
            <li><NavLink reload href="/products/" className="block py-2 text-[15px]">Все продукты</NavLink></li>
          </ul>
        </div>
        <div className="border-b py-3">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Библиотеки</p>
          <ul>
            {libraries.map((p) => <li key={p.href}><NavLink reload section href={p.href} className="block py-2 text-[15px]">{p.label}</NavLink></li>)}
            <li><NavLink reload href="/libraries/" className="block py-2 text-[15px]">Все библиотеки</NavLink></li>
          </ul>
        </div>
        <ul className="border-b py-3">
          <li><NavLink reload href="/services/" className="block py-2 text-[15px]">Все услуги</NavLink></li>
          {nav.map((n) => <li key={n.href}><NavLink reload section href={n.href} className="block py-2 text-[15px]">{n.label}</NavLink></li>)}
        </ul>
        <div className="mt-5 flex flex-col gap-2">
          <Button asChild size="lg"><a href={site.booking} target="_blank" rel="noopener">Записаться на консультацию</a></Button>
          <Button asChild size="lg" variant="outline"><a href={site.telegram} target="_blank" rel="noopener">Написать в Telegram</a></Button>
        </div>
      </div>
    </details>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <Container className="grid h-14 grid-cols-[1fr_auto] items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex items-center gap-2 justify-self-start font-semibold tracking-tight">
          <img src="/avatar.webp" alt={site.person} width={28} height={28} className="size-7 shrink-0 rounded-full object-cover shadow-[0_1px_3px_rgb(0_0_0/0.18)]" />
          {site.name}
        </Link>
        <nav className="hidden items-center justify-center gap-4 text-sm text-muted-foreground md:flex lg:gap-6">
          <ServicesMenu />
          <ListMenu label="Продукты" href="/products/" items={products} />
          <ListMenu label="Библиотеки" href="/libraries/" items={libraries} />
          {nav.map((n) => (
            <NavLink key={n.href} href={n.href} section className={"wide" in n ? "hidden hover:text-foreground lg:inline" : "hover:text-foreground"}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-1">
          <SiteSearch />
          <ThemeToggle />
          <TelegramButton />
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
