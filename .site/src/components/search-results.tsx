"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { groupHits, Marked, trackSearch, useSearch } from "./site-search";

const plural = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "результат" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "результата" : "результатов");

// Полный список результатов на /search/?q=…
export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const { hits, fixed, loading, error } = useSearch(query, true, 200);
  const groups = useMemo(() => groupHits(hits), [hits]);
  const tracked = useRef("");

  useEffect(() => {
    const p = params.get("q") ?? "";
    setQuery((cur) => (cur.trim() === p ? cur : p));
  }, [params]);

  // Адрес страницы повторяет запрос — результатами можно поделиться
  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim();
      if (q !== (params.get("q") ?? "")) router.replace(q ? `/search/?q=${encodeURIComponent(q)}` : "/search/", { scroll: false });
      if (q.length > 2 && tracked.current !== q) { tracked.current = q; trackSearch(q); }
    }, 600);
    return () => clearTimeout(t);
  }, [query, params, router]);

  const q = query.trim();
  return (
    <>
      <form action="/search/" onSubmit={(e) => e.preventDefault()} role="search" className="mt-8 flex items-center gap-2 rounded-lg border px-4 focus-within:ring-[3px] focus-within:ring-ring/50">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input name="q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus={!initial} placeholder="Услуги, термины, инструменты, статьи…" aria-label="Что найти" autoComplete="off" enterKeyHint="search" className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
      </form>

      {q && !loading && !error && (
        <p className="mt-4 text-sm text-muted-foreground">
          {hits.length ? `${hits.length} ${plural(hits.length)}` : `По запросу «${q}» ничего не нашлось`}
          {fixed && hits.length > 0 && ` по запросу «${fixed}»`}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-muted-foreground">Не получилось загрузить поиск. Обновите страницу.</p>}

      {q && !loading && !hits.length && !error && (
        <p className="mt-2 text-sm text-muted-foreground">
          Попробуйте другое слово, загляните в <Link href="/glossary/" className="text-brand underline underline-offset-2">глоссарий</Link> и <Link href="/tools/" className="text-brand underline underline-offset-2">каталог инструментов</Link> или <a href="https://t.me/nikalimp" target="_blank" rel="noopener" className="text-brand underline underline-offset-2">спросите меня в Telegram</a>.
        </p>
      )}

      {groups.map((g) => (
        <section key={g.section} className="mt-10">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">{g.section} · {g.items.length}</h2>
          <ul className="divide-y rounded-xl border">
            {g.items.map((h) => (
              <li key={h.u}>
                <Link href={h.u} onClick={() => trackSearch(q, h.u)} className="block px-4 py-3.5 hover:bg-accent">
                  <span className="block font-medium"><Marked text={h.t} terms={h.terms} /></span>
                  {h.snippet && <span className="mt-1 block text-sm leading-relaxed text-muted-foreground"><Marked text={h.snippet} terms={h.terms} /></span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
