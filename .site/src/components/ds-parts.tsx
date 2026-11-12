import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { DsCover } from "./ds-cover";
import { PRICING_LABEL, STATUS_LABEL, TYPE_LABEL, type DsItem } from "@/lib/design-systems";

export const dsHref = (x: DsItem) => (x.kind === "system" ? `/design-systems/${x.slug}/` : `/ui-libraries/${x.slug}/`);
const stars = (s: string | null) => s?.replace("≈", "").trim();

/** Карточка системы или библиотеки: обложка, название, суть, цена и звёзды */
export function DsCard({ x, tags, compact }: { x: DsItem; tags?: string; compact?: boolean }) {
  return (
    <li data-tags={tags} data-q={`${x.name} ${x.short} ${x.frameworks.join(" ")} ${x.types.map((t) => TYPE_LABEL[t]).join(" ")}`}>
      <Link href={dsHref(x)} className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand/40">
        <DsCover item={x} className="border-b" />
        <span className="flex flex-1 flex-col p-4">
          <span className="flex items-start justify-between gap-2">
            <span className="font-semibold group-hover:text-brand">{x.name}</span>
            {x.stars && <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground"><Star className="size-3" aria-hidden="true" />{stars(x.stars)}</span>}
          </span>
          <span className="mt-1 block flex-1 text-sm text-muted-foreground">{x.short}</span>
          {!compact && (
            <span className="mt-3 flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-full border px-2 py-0.5">{PRICING_LABEL[x.pricing]}</span>
              {x.status !== "active" && <span className="rounded-full border border-amber-500/40 px-2 py-0.5 text-amber-700 dark:text-amber-400">{STATUS_LABEL[x.status]}</span>}
              {x.frameworks.slice(0, 2).map((f) => <span key={f} className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{f}</span>)}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

/** Карточка фактов: стек, установка, цена, лицензия, Россия, ИИ, ссылки */
export function DsFacts({ x, systems }: { x: DsItem; systems?: DsItem[] }) {
  const rows: [string, React.ReactNode][] = [
    ["Тип", x.types.map((t) => TYPE_LABEL[t]).join(", ")],
    ...(systems?.length ? [["Для систем", <span key="s">{systems.map((s, i) => <span key={s.slug}>{i ? ", " : ""}<Link href={dsHref(s)} className="text-brand hover:underline">{s.name}</Link></span>)}</span>] as [string, React.ReactNode]] : []),
    ["Стек", [x.frameworks.join(", "), x.styling].filter(Boolean).join(" · ")],
    ["Установка", x.install],
    ["Объём", x.size],
    ["Цена", x.price ?? PRICING_LABEL[x.pricing]],
    ["Лицензия", x.license],
    ["Из России", x.ru],
    ["ИИ и агенты", x.ai],
    ["GitHub", x.github ? <a key="g" href={`https://github.com/${x.github}`} target="_blank" rel="noopener nofollow" className="text-brand hover:underline">{x.github}{x.stars ? ` · ${x.stars}` : ""}</a> : null],
    ["Сайт", <a key="u" href={x.url} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1 text-brand hover:underline">{x.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}<ArrowUpRight className="size-3.5" /></a>],
    ["Проверено", x.checked.split("-").reverse().join(".")],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-3 rounded-xl border bg-card p-5 text-sm sm:grid-cols-[9rem_1fr]">
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Плашка для закрытых, переехавших и редко обновляемых записей */
export function DsStatus({ x }: { x: DsItem }) {
  if (x.status === "active") return null;
  const text = {
    slow: "Проект почти не обновляется: перед стартом проверьте последние релизы и совместимость с вашей версией фреймворка.",
    moved: "Проект переехал или сменил название — подробности в описании. Ссылка «Сайт» ведёт на актуальный адрес.",
    archived: "Продукт закрыт для новых клиентов: купить или скачать его сейчас нельзя. Запись оставлена для тех, у кого он уже есть, и для сравнения с альтернативами.",
  }[x.status];
  return <p role="note" className="mx-auto mt-6 max-w-3xl rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm"><b>{STATUS_LABEL[x.status]}.</b> {text}</p>;
}
