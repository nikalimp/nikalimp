"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { CaseStudy } from "@/lib/case-studies";

// Кейсы на главной (19.11.2026): одна колонка, внутри карточки — картинка слева, текст справа.
// Эффект — «стопка»: на широком экране карточки прилипают к верху со сдвигом и накрывают друг друга,
// а нижняя карточка чуть уменьшается и темнеет по мере того, как её закрывает следующая.
// Все кейсы есть в HTML; лишние до нажатия «Показать все» скрыты атрибутом hidden. Без анимации при prefers-reduced-motion.
const VISIBLE = 3;

export function CaseStack({ cases }: { cases: CaseStudy[] }) {
  const [all, setAll] = useState(false);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const ol = list.current;
    if (!ol || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const items = [...ol.querySelectorAll<HTMLElement>(":scope > li:not([hidden])")];
      items.forEach((li, i) => {
        const next = items[i + 1];
        const card = li.firstElementChild as HTMLElement | null;
        if (!card) return;
        if (!next || getComputedStyle(li).position !== "sticky") { card.style.removeProperty("--cover"); return; }
        // Насколько следующая карточка накрыла текущую: 0 — ещё не дошла, 1 — накрыла целиком
        const a = li.getBoundingClientRect(), b = next.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (a.bottom - b.top) / a.height));
        card.style.setProperty("--cover", p.toFixed(3));
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [all]);

  return (
    <>
      <ol ref={list} className="case-stack mt-10 space-y-6" aria-label="Кейсы">
        {cases.map((c, i) => (
          <li key={c.slug} hidden={!all && i >= VISIBLE} className="md:sticky" style={{ top: `calc(5rem + ${Math.min(i, VISIBLE) * 1.25}rem)` }}>
            <article className="case-stack-card group grid overflow-hidden rounded-2xl border bg-background shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.18)] md:grid-cols-2">
              <Link href={`/cases/${c.slug}/`} tabIndex={-1} aria-hidden="true" className="block overflow-hidden border-b md:border-b-0 md:border-r">
                {c.cover && <img src={c.cover} alt="" width={1600} height={1000} loading={i < 2 ? "eager" : "lazy"} className="aspect-[16/10] h-full w-full object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.02]" />}
              </Link>
              <div className="flex flex-col p-6 sm:p-8">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{c.type} · {c.status === "Запущен" ? c.year : c.status}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight"><Link href={`/cases/${c.slug}/`} className="hover:text-brand">{c.client}</Link></h3>
                <p className="mt-3 text-muted-foreground">{c.description}</p>
                {c.metrics.length > 0 && (
                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-5">
                    {c.metrics.slice(0, 2).map((m) => (
                      <div key={m.label}>
                        <dt className="sr-only">{m.label}</dt>
                        <dd className="text-2xl font-semibold tracking-tight text-brand tabular-nums">{m.value}</dd>
                        <dd className="mt-1 text-sm text-muted-foreground">{m.label}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <Link href={`/cases/${c.slug}/`} className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-brand hover:underline">Читать кейс<ArrowRight className="size-4" /></Link>
              </div>
            </article>
          </li>
        ))}
      </ol>
      {cases.length > VISIBLE && !all && (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setAll(true)} className="inline-flex h-11 items-center gap-2 rounded-lg border bg-background px-5 text-sm font-medium hover:bg-accent">
            Показать все — {cases.length}<ChevronDown className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
