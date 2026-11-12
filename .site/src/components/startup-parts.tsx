import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Startup, StartupCategory } from "@/lib/startups";

export const initial = (name: string) => name.replace(/^[^\p{L}\p{N}]+/u, "").charAt(0).toUpperCase();

/** Карточка проекта в каталоге: ведёт на его страницу /startups/<slug>/. */
export function StartupCard({ it, cats, linked = true }: { it: Startup; cats: Record<string, string>; linked?: boolean }) {
  const inner = (
    <>
      <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-base font-semibold text-brand">{initial(it.n)}</span>
      <span className="min-w-0">
        <span className="block font-semibold leading-snug group-hover:text-brand">{it.n}</span>
        {it.t && <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{it.t}</span>}
        {it.c.length > 0 && (
          <span className="mt-2.5 flex flex-wrap gap-1">{it.c.slice(0, 2).map((c) => cats[c] && <Badge key={c} variant="outline">{cats[c]}</Badge>)}</span>
        )}
      </span>
    </>
  );
  return (
    <li className="[content-visibility:auto] [contain-intrinsic-size:auto_120px]">
      {linked ? (
        <Link href={`/startups/${it.s}/`} className="group flex h-full gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-brand/40">{inner}</Link>
      ) : (
        <div className="flex h-full gap-3 rounded-xl border bg-card p-4">{inner}</div>
      )}
    </li>
  );
}

const tab = (on: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? "border-foreground bg-foreground text-background" : "hover:bg-accent"}`;
const subTab = (on: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors ${on ? "bg-brand-bg text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`;

/** Табы категорий: верхний уровень и, внутри раздела, его подкатегории. Ссылки на страницы категорий — их видят поисковики. */
export function CategoryTabs({ categories, total, active }: { categories: StartupCategory[]; total: number; active?: string }) {
  const cur = categories.find((c) => c.slug === active);
  const top = cur?.parent ?? cur?.slug;
  // Активный раздел ставим сразу после «Все» — в прокручиваемой строке он всегда на виду
  const tops = categories.filter((c) => !c.parent).sort((a, b) => Number(b.slug === top) - Number(a.slug === top));
  const kids = top ? categories.filter((c) => c.parent === top) : [];
  return (
    <nav aria-label="Категории" className="mt-8">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
        <Link href="/startups/" aria-current={!active ? "page" : undefined} className={tab(!active)}>Все <span className="font-mono text-xs opacity-60">{total}</span></Link>
        {tops.map((c) => (
          <Link key={c.slug} href={`/startups/c/${c.slug}/`} aria-current={c.slug === active ? "page" : undefined} className={tab(c.slug === top)}>
            {c.name} <span className="font-mono text-xs opacity-60">{c.count}</span>
          </Link>
        ))}
      </div>
      {kids.length > 0 && (
        <div className="-mx-4 mt-2 flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
          <Link href={`/startups/c/${top}/`} aria-current={active === top ? "page" : undefined} className={subTab(active === top)}>Все в разделе</Link>
          {kids.map((c) => (
            <Link key={c.slug} href={`/startups/c/${c.slug}/`} aria-current={c.slug === active ? "page" : undefined} className={subTab(c.slug === active)}>
              {c.name} <span className="font-mono text-xs opacity-60">{c.count}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
