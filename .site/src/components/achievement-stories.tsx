"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { AchievementGroup } from "@/lib/achievements";

const DURATION = 5000;

/** Сертификаты как сторис: кружки по выдавшим, по нажатию — просмотр на весь экран с автопрокруткой. */
export function AchievementStories({ groups }: { groups: AchievementGroup[] }) {
  const [open, setOpen] = useState<{ g: number; i: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const last = useRef<HTMLButtonElement | null>(null);
  const still = useRef(false);

  const close = useCallback(() => { setOpen(null); last.current?.focus(); }, []);
  const go = useCallback((dir: 1 | -1) => {
    setProgress(0);
    setOpen((cur) => {
      if (!cur) return cur;
      const g = groups[cur.g];
      if (dir === 1 && cur.i < g.items.length - 1) return { g: cur.g, i: cur.i + 1 };
      if (dir === 1) return cur.g < groups.length - 1 ? { g: cur.g + 1, i: 0 } : null;
      if (cur.i > 0) return { g: cur.g, i: cur.i - 1 };
      return cur.g > 0 ? { g: cur.g - 1, i: groups[cur.g - 1].items.length - 1 } : { g: cur.g, i: 0 };
    });
  }, [groups]);

  useEffect(() => { still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  useEffect(() => { if (open) setSeen((s) => new Set(s).add(groups[open.g].id)); }, [open, groups]);
  useEffect(() => { if (open === null) last.current?.focus(); }, [open]);

  // Автопрокрутка: полоса заполняется за DURATION, при «меньше движения» — только вручную
  useEffect(() => {
    if (!open || paused || still.current) return;
    let raf = 0, start = performance.now() - progress * DURATION;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setProgress(p);
      if (p >= 1) go(1); else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paused, go]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.documentElement.style.overflow = ""; };
  }, [open, close, go]);

  const g = open ? groups[open.g] : null;
  const it = g && open ? g.items[open.i] : null;

  return (
    <>
      <ul className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:gap-6 sm:px-0" aria-label="Сертификаты и награды">
        {groups.map((gr, k) => (
          <li key={gr.id} className="w-24 shrink-0 text-center">
            <button type="button" onClick={(e) => { last.current = e.currentTarget; setProgress(0); setPaused(false); setOpen({ g: k, i: 0 }); }}
              className="group block w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${gr.name}: ${gr.items.length} ${gr.items.length === 1 ? "документ" : gr.items.length < 5 ? "документа" : "документов"}`}>
              <span className={`mx-auto block size-20 rounded-full p-[3px] transition-transform group-hover:scale-105 ${seen.has(gr.id) ? "bg-border" : "bg-[conic-gradient(from_200deg,var(--brand),#a855f7,#f97316,var(--brand))]"}`}>
                <span className="block size-full overflow-hidden rounded-full border-[3px] border-background bg-muted">
                  <img src={`/achievements/${gr.items[0].id}-thumb.webp`} alt="" width={74} height={74} loading="lazy" className="size-full object-cover" />
                </span>
              </span>
              <span className="mt-2 block text-sm font-medium leading-tight">{gr.name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{gr.caption}</span>
            </button>
          </li>
        ))}
      </ul>

      {g && it && open && (
        <div role="dialog" aria-modal="true" aria-label={`${g.name}: ${it.title}`} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative flex h-full w-full max-w-[min(100vw,calc(100dvh*0.62))] flex-col bg-neutral-950 text-white sm:my-6 sm:h-[calc(100dvh-3rem)] sm:rounded-2xl">
            <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-3">
              {g.items.map((x, k) => (
                <span key={x.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                  <span className="block h-full bg-white" style={{ width: `${k < open.i ? 100 : k > open.i ? 0 : progress * 100}%` }} />
                </span>
              ))}
            </div>
            <div className="absolute inset-x-0 top-5 z-20 flex items-center gap-3 px-4 pt-2">
              <img src={`/achievements/${g.items[0].id}-thumb.webp`} alt="" className="size-8 rounded-full object-cover" />
              <p className="min-w-0 flex-1 text-sm"><span className="font-semibold">{g.name}</span> <span className="text-white/60">{it.date}</span></p>
              <button type="button" onClick={close} aria-label="Закрыть" autoFocus className="inline-flex size-10 items-center justify-center rounded-full hover:bg-white/10"><X className="size-5" /></button>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-3 pt-16 pb-28"
              onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
              <img key={it.id} src={`/achievements/${it.id}.webp`} alt={`${it.title}, ${g.name}`} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
              <button type="button" onClick={() => go(-1)} aria-label="Предыдущий" className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize outline-none"><span className="sr-only">Предыдущий</span></button>
              <button type="button" onClick={() => go(1)} aria-label="Следующий" className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize outline-none"><span className="sr-only">Следующий</span></button>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t sm:rounded-b-2xl from-black/80 to-transparent px-5 pb-6 pt-10">
              <p className="text-lg font-semibold leading-snug">{it.title}</p>
              <p className="mt-1 text-sm text-white/70">{g.caption}</p>
              {it.verify && <a href={it.verify} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1 text-sm text-white underline underline-offset-4">Проверить подлинность<ArrowUpRight className="size-4" /></a>}
            </div>
            <button type="button" onClick={() => go(-1)} aria-label="Предыдущий документ" className="absolute left-[-3.5rem] top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:inline-flex"><ChevronLeft className="size-5" /></button>
            <button type="button" onClick={() => go(1)} aria-label="Следующий документ" className="absolute right-[-3.5rem] top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:inline-flex"><ChevronRight className="size-5" /></button>
          </div>
        </div>
      )}
    </>
  );
}
