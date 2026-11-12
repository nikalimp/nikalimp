"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { StoryStep } from "@/lib/story";

/** Сторителлинг на главной: карточки по годам, горизонтальная прокрутка со snap, кнопки и ползунок прогресса.
 *  Весь текст в HTML — без JavaScript карточки просто листаются пальцем или колесом. */
export function StoryCarousel({ steps }: { steps: StoryStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { el.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector("li");
    const w = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  const seek = (v: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: v * (el.scrollWidth - el.clientWidth) });
  };

  return (
    <div className="mt-10">
      <ol ref={ref} aria-label="Путь по годам" className="story-track -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6">
        {steps.map((s) => (
          <li key={s.years} className="flex w-[88%] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-background sm:w-[62%] lg:w-[44%]">
            <img src={s.img} alt={s.imgAlt} width={800} height={533} loading="lazy" decoding="async" className="aspect-[3/2] w-full border-b object-cover" />
            <div className="flex flex-1 flex-col p-6">
              <p className="font-mono text-sm text-brand">{s.years}</p>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              {(s.tags || s.people) && (
                <ul className="mt-auto flex flex-wrap gap-1.5 pt-4" aria-label="Теги">
                  {s.tags?.map((t) => {
                    const inner = <>{t.icon && <img src={t.icon} alt="" width={14} height={14} className="h-3.5 w-auto rounded-[2px]" />}{t.label}{t.href && <ArrowUpRight className="size-3 text-muted-foreground" />}</>;
                    return (
                      <li key={t.label}>
                        {t.href
                          ? <a href={t.href} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-0.5 text-xs hover:bg-accent">{inner}</a>
                          : <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-0.5 text-xs">{inner}</span>}
                      </li>
                    );
                  })}
                  {s.people?.map((p) => (
                    <li key={p.name} className="inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-[11px]">
                      {p.img ? (
                        <img src={p.img} alt="" width={24} height={24} loading="lazy" className="size-5 rounded-full border object-cover" />
                      ) : (
                        <span aria-hidden="true" className="inline-flex size-5 items-center justify-center rounded-full bg-brand-bg font-mono text-[9px] font-semibold text-brand">{p.name.replace(/[^\p{L}\d]/gu, "").slice(0, 2).toUpperCase()}</span>
                      )}
                      {p.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex items-center gap-4">
        <button type="button" onClick={() => step(-1)} aria-label="Предыдущая эпоха" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border hover:bg-accent disabled:opacity-40" disabled={progress <= 0.001}><ArrowLeft className="size-4" /></button>
        <input
          type="range" min={0} max={1000} value={Math.round(progress * 1000)}
          onChange={(e) => seek(Number(e.target.value) / 1000)}
          aria-label="Прокрутка по годам"
          className="story-range h-1 flex-1 cursor-pointer accent-[var(--brand)]"
        />
        <button type="button" onClick={() => step(1)} aria-label="Следующая эпоха" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border hover:bg-accent disabled:opacity-40" disabled={progress >= 0.999}><ArrowRight className="size-4" /></button>
      </div>
    </div>
  );
}
