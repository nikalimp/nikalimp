import type { Metadata } from "next";
import { ArrowUpRight, BriefcaseBusiness, Mail, Newspaper, Phone, Send } from "lucide-react";
import { site } from "@/lib/site";
import { cv } from "@/lib/cv";
import { SocialGlyph, type SocialIcon } from "@/components/social-icons";

// Страница-визитка: на неё ведёт QR-код на обоях телефона и визитках. Короткая и без шапки — только главное и ссылки.
export const metadata: Metadata = {
  title: `${site.person} — визитка`,
  description: "Никита Алимпиев: личные и корпоративные сайты с продвижением в нейросетях. Кейсы, блог, контакты и соцсети на одной странице.",
  alternates: { canonical: "/card/" },
  robots: { index: false, follow: true },
};

const glyph: Record<string, SocialIcon | undefined> = { YouTube: "youtube", "Instagram*": "instagram", "Telegram-канал": "telegram", TikTok: "tiktok", LinkedIn: "linkedin" };
const pages = [
  { href: "/cases/", label: "Кейсы", text: "Сайты и продукты, которые я сделал", icon: BriefcaseBusiness },
  { href: "/blog/", label: "Блог", text: "Статьи про сайты, SEO и нейросети", icon: Newspaper },
  { href: "/contacts/", label: "Контакты", text: "Почта, телефон и реквизиты", icon: Mail },
];

export default function CardPage() {
  return (
    <div className="vcard mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-4 py-12 text-center">
      {/* На визитке шапка и подвал сайта не нужны */}
      <style>{"body:has(.vcard)>header,body:has(.vcard)>footer{display:none}"}</style>
      <img src="/avatar.webp" alt={site.person} width={112} height={112} className="size-28 rounded-full object-cover shadow-[0_2px_12px_rgb(0_0_0/0.18)]" />
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">{site.person}</h1>
      <p className="mt-1.5 text-muted-foreground">{cv.role}</p>
      <p className="mt-5 text-pretty leading-relaxed">Делаю личные и корпоративные сайты, которые находят поисковики и рекомендуют нейросети: ChatGPT, Алиса, GigaChat. Дизайн, разработка и GEO с {site.since} года — больше 100 сайтов.</p>

      <div className="mt-7 grid w-full grid-cols-2 gap-2">
        <a href={site.telegram} target="_blank" rel="noopener" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-medium text-background hover:opacity-90"><Send className="size-4" />Telegram</a>
        <a href={`tel:${site.phoneHref}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium hover:bg-accent"><Phone className="size-4" />Позвонить</a>
      </div>

      <ul className="mt-6 w-full space-y-2 text-left">
        {pages.map((p) => (
          <li key={p.href}>
            <a href={p.href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-brand/40">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand"><p.icon className="size-5" /></span>
              <span className="min-w-0 flex-1"><span className="block font-medium">{p.label}</span><span className="block text-sm text-muted-foreground">{p.text}</span></span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </li>
        ))}
      </ul>

      <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Соцсети">
        {site.socials.map((s) => {
          const g = glyph[s.label];
          return (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener me" className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm hover:bg-accent">
                {g && <SocialGlyph name={g} className="size-4" />}{s.label}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-xs text-muted-foreground">{site.metaNote}</p>
      <a href="/" className="mt-2 text-sm text-muted-foreground hover:text-foreground">nikalimp.ru</a>
    </div>
  );
}
