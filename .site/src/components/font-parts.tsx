import Link from "next/link";

export type FontCardData = { s: string; n: string; c: boolean; k: number; a: string; svg?: number };
const word = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "начертание" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "начертания" : "начертаний");

/** Карточка шрифта: превью названия этим шрифтом (SVG), лицензия, число начертаний, автор. */
export function FontCard({ f }: { f: FontCardData }) {
  return (
    <li className="[content-visibility:auto] [contain-intrinsic-size:auto_170px]">
      <Link href={`/fonts/${f.s}/`} className="group flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:border-brand/40">
        <span className="flex h-20 items-center justify-center rounded-lg bg-muted/60 px-4">
          {f.svg ? <img src={`/font-previews/${f.s}.svg`} alt={`Шрифт ${f.n}`} loading="lazy" decoding="async" className="max-h-12 max-w-full object-contain dark:invert" /> : <span className="text-2xl">{f.n}</span>}
        </span>
        <span className="mt-3 block font-semibold group-hover:text-brand">{f.n}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{f.c ? "Для коммерции" : "Для личного использования"} · {f.k} {word(f.k)}</span>
        {f.a && <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">{f.a}</span>}
      </Link>
    </li>
  );
}
