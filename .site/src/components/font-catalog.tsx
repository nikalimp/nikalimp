"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FontCard, type FontCardData } from "./font-parts";

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");
const word = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "шрифт" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "шрифта" : "шрифтов");
const TABS = [["all", "Все"], ["c", "Для коммерции"], ["p", "Для личного использования"]] as const;

/** Каталог шрифтов: первые карточки приходят статикой, полный список, вкладки и поиск — после загрузки /fonts/data.json. */
export function FontCatalog({ initial, total, counts }: { initial: FontCardData[]; total: number; counts: Record<string, number> }) {
  const [items, setItems] = useState<FontCardData[] | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(initial.length);
  const [error, setError] = useState(false);
  const need = !!q.trim() || tab !== "all" || limit > initial.length;

  useEffect(() => {
    if (!need || items || error) return;
    fetch("/fonts/data.json").then((r) => r.json()).then((d) => setItems(d.items)).catch(() => setError(true));
  }, [need, items, error]);

  const found = useMemo(() => {
    const src = items ?? initial;
    const words = norm(q.trim()).split(/\s+/).filter(Boolean);
    return src.filter((f) => (tab === "all" || (tab === "c") === f.c) && words.every((w) => norm(`${f.n} ${f.a}`).includes(w)));
  }, [items, initial, q, tab]);
  const loading = need && !items && !error;

  return (
    <>
      <div className="mt-8 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label="Лицензия">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setLimit(initial.length); }}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${tab === k ? "border-foreground bg-foreground text-background" : "hover:bg-accent"}`}>
            {label} <span className="font-mono text-xs opacity-60">{counts[k]}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border px-4 focus-within:ring-[3px] focus-within:ring-ring/50">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(initial.length); }} placeholder="Название шрифта или автора" aria-label="Поиск шрифта" autoComplete="off" className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
      </div>
      <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
        {error ? "Не получилось загрузить список. Обновите страницу." : loading ? "Загружаю…" : need ? `${found.length} ${word(found.length)}` : `${total} ${word(total)}`}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{found.slice(0, limit).map((f) => <FontCard key={f.s} f={f} />)}</ul>
      {(found.length > limit || (!items && total > limit && !need)) && (
        <p className="mt-6 text-center">
          <button type="button" onClick={() => setLimit(limit + 120)} className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-accent">Показать ещё</button>
        </p>
      )}
    </>
  );
}
