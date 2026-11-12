import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies";

/** Карточка подробного кейса: скриншот, бренд, тип и одна главная цифра. */
export function CaseCard({ c }: { c: CaseStudy }) {
  const m = c.metrics[0];
  return (
    <Link href={`/cases/${c.slug}/`} className="card group flex flex-col overflow-hidden rounded-xl border bg-background hover:border-brand/40">
      {c.cover && <img src={c.cover} alt={`${c.client}: сайт`} width={1440} height={900} loading="lazy" className="aspect-[16/10] w-full border-b object-cover object-top" />}
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{c.type} · {c.status === "Запущен" ? c.year : c.status}</p>
        <p className="mt-1 text-lg font-semibold group-hover:text-brand">{c.client}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
        {m && <p className="mt-auto pt-4 text-sm"><span className="font-semibold text-brand">{m.value}</span> <span className="text-muted-foreground">{m.label}</span></p>}
      </div>
    </Link>
  );
}
