"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

/**
 * Фильтр каталога над списком, который уже отрисован на сервере (текст виден без JavaScript).
 * Карточки — <li data-tags="… …" data-q="…"> внутри #listId; вкладка показывает карточки с тегом, поиск — по data-q.
 */
export function DsFilter({ listId, tabs, placeholder, unit }: { listId: string; tabs: { key: string; label: string; count: number }[]; placeholder: string; unit: [string, string, string] }) {
  const [tab, setTab] = useState(tabs[0]?.key ?? "all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const list = document.getElementById(listId);
    if (!list) return;
    const words = norm(q.trim()).split(/\s+/).filter(Boolean);
    let n = 0;
    list.querySelectorAll<HTMLElement>("li[data-tags]").forEach((li) => {
      const ok = (tab === "all" || (li.dataset.tags ?? "").split(" ").includes(tab)) && words.every((w) => norm(li.dataset.q ?? "").includes(w));
      li.hidden = !ok;
      if (ok) n++;
    });
    setShown(n);
  }, [listId, tab, q]);

  const word = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? unit[0] : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? unit[1] : unit[2]);

  return (
    <div className="mt-8">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label="Разделы">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} aria-controls={listId} onClick={() => setTab(t.key)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${tab === t.key ? "border-foreground bg-foreground text-background" : "hover:bg-accent"}`}>
            {t.label} <span className="font-mono text-xs opacity-60">{t.count}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border px-4 focus-within:ring-[3px] focus-within:ring-ring/50">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoComplete="off" className="h-12 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
      </div>
      <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">{shown === null ? "" : shown ? `${shown} ${word(shown)}` : "Ничего не нашлось — попробуйте другое слово или вкладку «Все»."}</p>
    </div>
  );
}
