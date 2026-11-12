import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RussiaStatus, Tool } from "@/lib/tools";

export const RUSSIA_LABEL: Record<RussiaStatus, string> = { ok: "Работает в России", vpn: "В России: нужен VPN", card: "В России: нужна зарубежная карта", "vpn-card": "В России: VPN и зарубежная карта", blocked: "Не работает в России" };

/** Бейдж доступа из России: зелёный — работает, жёлтый — с оговорками, красный — не работает. */
export function RussiaBadge({ status, className }: { status?: RussiaStatus; className?: string }) {
  if (!status) return null;
  const tone =
    status === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : status === "blocked" ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
        : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400";
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", tone, className)}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{RUSSIA_LABEL[status]}</span>;
}

/** Плитка-монограмма вместо логотипа: первая буква названия, цвет — от категории. */
export function ToolMark({ t, size = "lg" }: { t: Pick<Tool, "name" | "category">; size?: "lg" | "sm" }) {
  const hues = [210, 160, 270, 25, 340, 190, 45, 120, 300, 0, 230, 90, 180];
  let h = 0; for (const ch of t.category) h = (h * 31 + ch.charCodeAt(0)) % hues.length;
  const letter = [...t.name.replace(/^[^\p{L}\d]+/u, "")][0]?.toUpperCase() ?? "?";
  return (
    <span aria-hidden="true" style={{ background: `oklch(0.93 0.05 ${hues[h]})`, color: `oklch(0.42 0.14 ${hues[h]})` }}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl font-semibold", size === "lg" ? "size-14 text-2xl" : "size-7 rounded-md text-sm")}>{letter}</span>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs">{children}</span>;
}

/** Короткая цена для таблиц: первая фраза раздела «Цена» без разметки. */
export const shortPrice = (t: Tool) => {
  const plain = t.price.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "").trim();
  const first = plain.split(/(?<=[.;])\s/)[0] ?? "";
  const f = first.replace(/[;,.:]+$/, "");
  return f.length > 90 ? f.slice(0, f.lastIndexOf(" ", 86)) + "…" : f;
};

export function ToolLink({ t }: { t: Pick<Tool, "slug" | "name" | "category"> }) {
  return <Link href={`/tools/${t.slug}/`} className="inline-flex items-center gap-2 font-medium hover:text-brand"><ToolMark t={t} size="sm" />{t.name}</Link>;
}
