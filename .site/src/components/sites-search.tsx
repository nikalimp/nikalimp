"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { GallerySite } from "@/lib/sites";
import { SiteCard, grid } from "./site-parts";

type Item = Pick<GallerySite, "s" | "n" | "t" | "c" | "k" | "img">;
const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");
const word = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "сайт" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "сайта" : "сайтов");
const STEP = 48;

/** Поиск и «Показать ещё»: пока запрос пустой, показывает статичный список (children), дальше — из /sites/data.json. */
export function SitesSearch({ niches, scope, children, shown, total }: { niches: Record<string, string>; scope?: string; children: React.ReactNode; shown: number; total: number }) {
  const [q, setQ] = useState("");
  const [more, setMore] = useState(0);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);
  const query = q.trim();

  useEffect(() => {
    if ((!query && !more) || items || error) return;
    fetch("/sites/data.json").then((r) => r.json()).then((d) => setItems(d.items)).catch(() => setError(true));
  }, [query, more, items, error]);

  const inScope = useMemo(() => {
    if (!items) return [];
    const [cat, niche] = (scope ?? "").split("/");
    return items.filter((i) => (!cat || i.c === cat) && (!niche || i.k === niche));
  }, [items, scope]);

  const found = useMemo(() => {
    if (!query) return [];
    const words = norm(query).split(/\s+/);
    return inScope.filter((i) => words.every((w) => norm(`${i.n} ${i.t} ${niches[i.k]} ${i.s}`).includes(w)));
  }, [inScope, query, niches]);

  return (
    <>
      <div className="mt-6 flex items-center gap-2 rounded-lg border px-4 focus-within:ring-[3px] focus-within:ring-ring/50">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название, ниша или домен: кофейня, ювелир, психолог…" aria-label="Поиск по примерам сайтов" autoComplete="off" className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
      </div>
      {query ? (
        <div aria-live="polite">
          <p className="mt-5 text-sm text-muted-foreground">{error ? "Не получилось загрузить поиск. Обновите страницу." : items ? (found.length ? `${found.length} ${word(found.length)}` : `По запросу «${query}» ничего не нашлось`) : "Ищу…"}</p>
          <ul className={`mt-4 ${grid}`}>{found.slice(0, 96).map((it) => <SiteCard key={it.s} it={it} niches={niches} />)}</ul>
        </div>
      ) : (
        <>
          {children}
          {more > 0 && items && <ul className={`mt-4 ${grid}`}>{inScope.slice(shown, shown + more).map((it) => <SiteCard key={it.s} it={it} niches={niches} />)}</ul>}
          {total > shown + more && (
            <p className="mt-8 text-center">
              <button type="button" onClick={() => setMore((m) => m + STEP)} className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-accent">
                {more && !items ? "Загружаю…" : `Показать ещё — осталось ${total - shown - more}`}
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}
