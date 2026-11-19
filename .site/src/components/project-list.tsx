import { ArrowUpRight } from "lucide-react";
import type { CaseItem } from "@/lib/cases";

/** Список проектов одного года: название, описание, NDA и ссылки — на /cases/ и на главной */
export function ProjectList({ year, items, className = "mt-8" }: { year: string; items: CaseItem[]; className?: string }) {
  return (
    <section className={className}>
      <h3 className="font-mono text-sm text-brand">{year}</h3>
      <ul className="mt-3 divide-y border-y">
        {items.map((c, i) => (
          <li key={i} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <p>{c.name && <span className="font-medium">{c.name}</span>}{c.name && <span className="text-muted-foreground"> — </span>}<span className={c.name ? "text-muted-foreground" : ""}>{c.text}</span></p>
            <p className="flex shrink-0 gap-4 text-sm">
              {c.nda && <span className="rounded border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">NDA</span>}
              {c.site && <a href={c.site} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 text-brand hover:underline">Сайт <ArrowUpRight className="size-3.5" /></a>}
              {c.behance && <a href={`https://www.behance.net/gallery/${c.behance}`} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 text-brand hover:underline">Behance <ArrowUpRight className="size-3.5" /></a>}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
