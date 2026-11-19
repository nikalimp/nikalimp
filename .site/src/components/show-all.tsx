"use client";

import { useState, type ReactNode } from "react";

/** Кнопка «Показать все» с числом в сером круге (19.11.2026) */
export function ShowAllButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-11 items-center gap-2.5 rounded-lg border bg-background pl-5 pr-3 text-sm font-medium hover:bg-accent">
      Показать все
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs tabular-nums text-muted-foreground">{count}</span>
    </button>
  );
}

/** Скрытый блок с кнопкой: содержимое уже в HTML, до нажатия скрыто атрибутом hidden */
export function ShowAll({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div hidden={!open}>{children}</div>
      {!open && <div className="mt-8 text-center"><ShowAllButton count={count} onClick={() => setOpen(true)} /></div>}
    </>
  );
}
