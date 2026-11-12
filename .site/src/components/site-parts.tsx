import Link from "next/link";
import type { GalleryCategory, GallerySite } from "@/lib/sites";

export const grid = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

/** Карточка сайта: обложка из галереи, название и ниша. Ведёт на страницу /sites/<slug>/. */
export function SiteCard({ it, niches, eager = false }: { it: Pick<GallerySite, "s" | "n" | "t" | "k" | "img">; niches: Record<string, string>; eager?: boolean }) {
  return (
    <li className="[content-visibility:auto] [contain-intrinsic-size:auto_420px]">
      <Link href={`/sites/${it.s}/`} className="group block h-full overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand/40">
        <span className="block aspect-[4/5] overflow-hidden border-b bg-muted">
          {/* Обложка — та же, что в источнике (CDN источника) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.img} alt={`Сайт ${it.n} — обложка`} width={720} height={900} loading={eager ? "eager" : "lazy"} decoding="async" className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]" />
        </span>
        <span className="block p-4">
          <span className="block font-semibold leading-snug group-hover:text-brand">{it.n}</span>
          {it.t && <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{it.t}</span>}
          <span className="mt-2 block text-xs text-muted-foreground">{niches[it.k]}</span>
        </span>
      </Link>
    </li>
  );
}

const tab = (on: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? "border-foreground bg-foreground text-background" : "hover:bg-accent"}`;
const subTab = (on: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors ${on ? "bg-brand-bg text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`;

/** Категории галереи и, внутри категории, её подкатегории-ниши. Обычные ссылки — их видят поисковики. */
export function SiteTabs({ categories, total, active }: { categories: GalleryCategory[]; total: number; active?: string }) {
  const top = active?.split("/")[0];
  const tops = categories.filter((c) => !c.parent);
  const kids = top ? categories.filter((c) => c.parent === top) : [];
  return (
    <nav aria-label="Категории" className="mt-8">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
        <Link href="/sites/" aria-current={!active ? "page" : undefined} className={tab(!active)}>Все <span className="font-mono text-xs opacity-60">{total}</span></Link>
        {tops.map((c) => (
          <Link key={c.slug} href={`/sites/c/${c.slug}/`} aria-current={c.slug === active ? "page" : undefined} className={tab(c.slug === top)}>
            {c.name} <span className="font-mono text-xs opacity-60">{c.count}</span>
          </Link>
        ))}
      </div>
      {kids.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 pb-2">
          <Link href={`/sites/c/${top}/`} aria-current={active === top ? "page" : undefined} className={subTab(active === top)}>Все в разделе</Link>
          {kids.map((c) => (
            <Link key={c.slug} href={`/sites/c/${c.slug}/`} aria-current={c.slug === active ? "page" : undefined} className={subTab(c.slug === active)}>
              {c.name} <span className="font-mono text-xs opacity-60">{c.count}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
