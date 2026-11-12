"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Startup } from "@/lib/startups";
import { StartupCard } from "./startup-parts";

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");
const word = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "проект" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "проекта" : "проектов");

/** Поиск по базе: пока запрос пустой, показывает статичный список (children), с запросом — результаты из /startups/data.json. */
export function StartupSearch({ cats, scope, children, shown, total }: { cats: Record<string, string>; scope?: string[]; children: React.ReactNode; shown?: number; total?: number }) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const [items, setItems] = useState<Startup[] | null>(null);
  const [error, setError] = useState(false);
  const query = q.trim();

  useEffect(() => {
    if ((!query && !all) || items || error) return;
    fetch("/startups/data.json").then((r) => r.json()).then((d) => setItems(d.items)).catch(() => setError(true));
  }, [query, all, items, error]);

  const found = useMemo(() => {
    if (!items || !query) return [];
    const words = norm(query).split(/\s+/);
    const inScope = scope ? new Set(scope) : null;
    return items.filter((i) => (!inScope || i.c.some((c) => inScope.has(c))) && words.every((w) => norm(`${i.n} ${i.t} ${i.c.map((c) => cats[c]).join(" ")}`).includes(w)));
  }, [items, query, scope, cats]);

  return (
    <>
      <div className="mt-6 flex items-center gap-2 rounded-lg border px-4 focus-within:ring-[3px] focus-within:ring-ring/50">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название или задача: CRM, расшифровка, доставка…" aria-label="Поиск по базе стартапов" autoComplete="off" className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
      </div>
      {query ? (
        <div aria-live="polite">
          <p className="mt-5 text-sm text-muted-foreground">{error ? "Не получилось загрузить поиск. Обновите страницу." : items ? (found.length ? `${found.length} ${word(found.length)}` : `По запросу «${query}» ничего не нашлось`) : "Ищу…"}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{found.slice(0, 120).map((it) => <StartupCard key={it.s} it={it} cats={cats} />)}</ul>
        </div>
      ) : (
        <>
          {children}
          {/* Остальные проекты подгружаются по кнопке — первый экран не тяжелеет */}
          {all && items && <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.slice(shown).map((it) => <StartupCard key={it.s} it={it} cats={cats} />)}</ul>}
          {shown !== undefined && total !== undefined && total > shown && !(all && items) && (
            <p className="mt-6 text-center">
              <button type="button" onClick={() => setAll(true)} className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-accent">{all ? "Загружаю…" : `Показать все ${total} ${word(total)}`}</button>
            </p>
          )}
        </>
      )}
    </>
  );
}
