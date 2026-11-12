"use client";

import { useState } from "react";

/** Образец текста: свой текст и размер, все начертания шрифта. Начертания приходят с сервера уже с подписями. */
export function FontSpecimen({ family, styles, sample }: { family: string; styles: { w: number; i: number; label: string }[]; sample: string }) {
  const [text, setText] = useState("");
  const [size, setSize] = useState(40);
  const [all, setAll] = useState(false);
  // Сначала главные начертания, остальные — по кнопке: 18 строк образца подряд утомляют
  const key = ["400-0", "700-0", "400-1", "300-0", "500-0", "900-0"];
  const main = [...styles].sort((a, b) => (key.indexOf(`${a.w}-${a.i}`) + 99) % 99 - (key.indexOf(`${b.w}-${b.i}`) + 99) % 99 || a.w - b.w);
  const shown_ = all ? styles : main.slice(0, 6).sort((a, b) => a.w - b.w || a.i - b.i);
  const shown = text.trim() || sample;
  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишите свой текст" aria-label="Свой текст для образца" className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-[3px] focus:ring-ring/50" />
        <label className="flex items-center gap-3 text-sm text-muted-foreground">
          Размер
          <input type="range" min={16} max={96} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-36 accent-current" aria-label="Размер шрифта" />
          <span className="w-10 font-mono text-xs">{size}px</span>
        </label>
      </div>
      <ul className="mt-6 divide-y">
        {shown_.map((s) => (
          <li key={s.label} className="py-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 break-words leading-tight" style={{ fontFamily: `"${family}", sans-serif`, fontWeight: s.w, fontStyle: s.i ? "italic" : "normal", fontSize: size }}>{shown}</p>
          </li>
        ))}
      </ul>
      {styles.length > 6 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-2 inline-flex h-9 items-center rounded-lg border px-3 text-sm hover:bg-accent">{all ? "Показать главные начертания" : `Показать все ${styles.length} начертаний`}</button>
      )}
    </div>
  );
}
