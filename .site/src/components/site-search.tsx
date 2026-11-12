"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { ArrowRight, BookOpen, CornerDownLeft, FileText, Loader2, Package, Rocket, Search, Sparkles, Type, Wrench, X } from "lucide-react";
import { highlight, search, SECTION_ORDER, type SearchDoc, type SearchHit } from "@/lib/search";
import { cn } from "@/lib/utils";

// Индекс скачивается один раз за визит и только когда человек открыл поиск
let indexPromise: Promise<SearchDoc[]> | null = null;
export function loadIndex() {
  indexPromise ??= fetch("/search-index.json").then((r) => (r.ok ? r.json() : Promise.reject(r.status))).catch((e) => { indexPromise = null; throw e; });
  return indexPromise;
}

export function useSearch(query: string, enabled = true, limit = 40) {
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!enabled || docs) return;
    loadIndex().then(setDocs, () => setError(true));
  }, [enabled, docs]);
  const result = useMemo(() => (docs ? search(docs, query, limit) : { hits: [] as SearchHit[] }), [docs, query, limit]);
  return { ...result, loading: enabled && !docs && !error, error };
}

// Цель в Яндекс Метрике: какие запросы ищут на сайте и что открывают
export function trackSearch(query: string, url?: string) {
  const ym = (window as unknown as { ym?: (...a: unknown[]) => void }).ym;
  ym?.(113548506, "reachGoal", "site_search", { query: query.trim().slice(0, 100), url });
}

const icons: Record<string, typeof FileText> = { Услуги: Sparkles, Продукты: Package, Глоссарий: BookOpen, Инструменты: Wrench, Стартапы: Rocket, Шрифты: Type, Блог: FileText, Страницы: FileText };

const quick = [
  { t: "Продвижение сайта в нейросетях", u: "/geo-audit/" },
  { t: "GEO-аудит и экспресс-проверка", u: "/geo-audit/" },
  { t: "Глоссарий GEO, AEO и SEO", u: "/glossary/" },
  { t: "Каталог инструментов", u: "/tools/" },
  { t: "Генератор политики конфиденциальности", u: "/privacy-generator/" },
  { t: "Генератор UTM-меток", u: "/utm-generator/" },
  { t: "Генератор QR-кода", u: "/qr-generator/" },
  { t: "Генератор договора оказания услуг", u: "/contract-generator/" },
  { t: "Сбор семантического ядра", u: "/semantics/" },
];

export function Marked({ text, terms }: { text: string; terms: string[] }) {
  return <>{highlight(text, terms).map((p, i) => (p.match ? <mark key={i} className="rounded-sm bg-brand-bg px-px text-brand">{p.text}</mark> : p.text))}</>;
}

// Группы по разделам; первым идёт раздел с самым точным результатом
export function groupHits(hits: SearchHit[]) {
  return SECTION_ORDER.map((s) => ({ section: s, items: hits.filter((h) => h.s === s) }))
    .filter((g) => g.items.length)
    .sort((a, b) => b.items[0].score - a.items[0].score);
}

export function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [mac, setMac] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { hits, fixed, loading, error } = useSearch(query, open, 30);
  const groups = useMemo(() => groupHits(hits), [hits]);
  const flat = useMemo(() => (query.trim() ? groups.flatMap((g) => g.items) : quick), [groups, query]);

  // Ctrl+K / ⌘K и «/» открывают поиск с любой страницы
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" || e.key === "K" || e.code === "KeyK") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "/" && !typing) { e.preventDefault(); setOpen(true); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = useCallback((url: string) => {
    if (query.trim()) trackSearch(query, url);
    setOpen(false);
    router.push(url);
  }, [query, router]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const item = flat[active];
      if (item) go(item.u);
      else if (query.trim()) go(`/search/?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const q = query.trim();
  let index = -1;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <Dialog.Trigger asChild>
        <button type="button" onPointerEnter={() => loadIndex().catch(() => {})} aria-label="Поиск по сайту" title={`Поиск (${mac ? "⌘" : "Ctrl+"}K)`} className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
          <Search className="size-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).querySelector("input")?.focus(); }}
          className="fixed left-1/2 top-3 z-50 flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border bg-background shadow-2xl sm:top-[12vh] sm:max-h-[min(640px,76vh)]"
        >
          <Dialog.Title className="sr-only">Поиск по сайту</Dialog.Title>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Услуги, термины, инструменты, статьи…"
              aria-label="Что найти"
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="site-search-list"
              aria-activedescendant={flat.length ? `ss-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              className="h-13 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            {loading && q && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
            <Dialog.Close aria-label="Закрыть" className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div ref={listRef} id="site-search-list" role="listbox" aria-label="Результаты" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {!q && (
              <div>
                <p className="px-2 pb-1 pt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Часто ищут</p>
                {quick.map((item, i) => (
                  <Link key={item.u} href={item.u} id={`ss-${i}`} data-index={i} role="option" aria-selected={active === i} onClick={(e) => { e.preventDefault(); go(item.u); }} onPointerMove={() => setActive(i)}
                    className={cn("flex items-center gap-2 rounded-md px-2 py-2 text-sm", active === i && "bg-accent")}>
                    <ArrowRight className="size-3.5 text-muted-foreground" />{item.t}
                  </Link>
                ))}
              </div>
            )}

            {q && error && <p className="px-3 py-8 text-center text-sm text-muted-foreground">Не получилось загрузить поиск. Обновите страницу и попробуйте ещё раз.</p>}

            {q && !loading && !error && !hits.length && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                <p>По запросу «{q}» ничего не нашлось.</p>
                <p className="mt-1">Попробуйте другое слово или <a href="https://t.me/nikalimp" target="_blank" rel="noopener" className="text-brand underline underline-offset-2">спросите меня в Telegram</a>.</p>
              </div>
            )}

            {q && fixed && hits.length > 0 && <p className="px-2 pb-1 pt-2 text-xs text-muted-foreground">Показываю результаты по запросу «{fixed}»</p>}

            {q && groups.map((g) => {
              const Icon = icons[g.section] ?? FileText;
              return (
                <div key={g.section} className="pb-1">
                  <p className="px-2 pb-1 pt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{g.section}</p>
                  {g.items.map((h) => {
                    index++;
                    const i = index;
                    return (
                      <Link key={h.u} href={h.u} id={`ss-${i}`} data-index={i} role="option" aria-selected={active === i} onClick={(e) => { e.preventDefault(); go(h.u); }} onPointerMove={() => setActive(i)}
                        className={cn("group flex gap-3 rounded-md px-2 py-2", active === i && "bg-accent")}>
                        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-sm font-medium sm:line-clamp-1"><Marked text={h.t} terms={h.terms} /></span>
                          {h.snippet && <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground"><Marked text={h.snippet} terms={h.terms} /></span>}
                        </span>
                        <CornerDownLeft className={cn("mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0", active === i && "opacity-100")} />
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 border-t px-4 py-2 text-xs text-muted-foreground">
            <span className="hidden items-center gap-3 sm:flex">
              <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> выбрать</span>
              <span><Kbd>Enter</Kbd> открыть</span>
              <span><Kbd>Esc</Kbd> закрыть</span>
            </span>
            {q && hits.length > 0 ? (
              <Link href={`/search/?q=${encodeURIComponent(q)}`} onClick={(e) => { e.preventDefault(); go(`/search/?q=${encodeURIComponent(q)}`); }} className="ml-auto inline-flex items-center gap-1 hover:text-foreground">
                Все результаты <ArrowRight className="size-3" />
              </Link>
            ) : (
              <span className="ml-auto">{mac ? "⌘" : "Ctrl+"}K — поиск с любой страницы</span>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border bg-muted px-1 py-px font-mono text-[10px]">{children}</kbd>;
}
