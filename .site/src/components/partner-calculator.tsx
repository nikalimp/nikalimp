"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { MAX_AMOUNT, SERVICES_MULTIPLIER, STEP, calcReward, fmtPct, fmtRub, tierLabel } from "@/lib/partner";
import { offers } from "@/lib/offers";

const priceOf = (s: string) => Number(s.replace(/[^\d]/g, ""));
const freeServices = [
  { title: offers.personal.title, price: priceOf(offers.personal.price) },
  { title: offers.corporate.title, price: priceOf(offers.corporate.price) },
];

const PRESETS = [150_000, 250_000, 350_000, 600_000];
const clamp = (n: number) => Math.min(MAX_AMOUNT, Math.max(0, Math.round(n / STEP) * STEP));

export function PartnerCalculator() {
  const [amount, setAmount] = useState(150_000);
  const [typed, setTyped] = useState<string | null>(null);
  const id = useId();
  const { tiers, total, effective } = calcReward(amount);

  const commitTyped = () => {
    if (typed === null) return;
    const n = Number(typed.replace(/[^\d]/g, ""));
    setAmount(Number.isFinite(n) ? Math.min(MAX_AMOUNT, Math.max(0, n)) : 0);
    setTyped(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label htmlFor={id} className="text-sm font-medium">Сумма договора с клиентом</label>
          <div className="flex items-center gap-1 text-2xl font-semibold tabular-nums tracking-tight">
            <input
              inputMode="numeric"
              aria-label="Сумма договора, ₽"
              value={typed ?? amount.toLocaleString("ru-RU")}
              onChange={(e) => setTyped(e.target.value)}
              onBlur={commitTyped}
              onKeyDown={(e) => e.key === "Enter" && commitTyped()}
              className="w-[7.5ch] bg-transparent text-right outline-none focus-visible:underline focus-visible:decoration-brand focus-visible:underline-offset-4"
            />
            <span>₽</span>
          </div>
        </div>

        <input
          id={id}
          type="range"
          min={0}
          max={MAX_AMOUNT}
          step={STEP}
          value={amount}
          onChange={(e) => setAmount(clamp(Number(e.target.value)))}
          aria-valuetext={fmtRub(amount)}
          className="mt-4 h-2 w-full cursor-pointer accent-brand"
        />
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>0 ₽</span><span>500 000 ₽</span><span>1 000 000 ₽</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setAmount(p)} className={cn("h-8 rounded-md border px-3 text-[13px] transition-colors hover:bg-accent", amount === p && "border-brand bg-brand-bg text-brand")}>
              {fmtRub(p)}
            </button>
          ))}
        </div>

        <ol className="mt-8 space-y-4">
          {tiers.map((t) => {
            const active = t.fill > 0 && t.fill < 1;
            const done = t.fill >= 1;
            return (
              <li key={t.from} className={cn("grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)_6.5rem] sm:gap-x-4", t.fill === 0 && "text-muted-foreground")}>
                <span className="tabular-nums">{tierLabel(t)}</span>
                <span className={cn("font-mono text-xs text-right", (active || done) && "text-brand")}>{fmtPct(t.rate)}</span>                <span className="text-right sm:order-last tabular-nums font-medium">{t.reward ? `+${fmtRub(t.reward)}` : "—"}</span>

                <div className="col-span-3 h-2 w-full overflow-hidden rounded-full bg-muted sm:col-span-1" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(t.fill * 100)} aria-label={`Заполнение слоя ${tierLabel(t)}`}>
                  <div className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out motion-reduce:transition-none" style={{ width: `${t.fill * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-6">
      <aside className="rounded-xl border bg-brand-bg p-5 sm:p-6 ">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Ваше вознаграждение</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-brand">{fmtRub(total)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{fmtPct(effective)} от суммы договора</p>
        <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Договор</dt><dd className="tabular-nums">{fmtRub(amount)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Слоёв задействовано</dt><dd className="tabular-nums">{tiers.filter((t) => t.base > 0).length} из {tiers.length}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Ставка верхнего слоя</dt><dd className="tabular-nums">{fmtPct([...tiers].reverse().find((t) => t.base > 0)?.rate ?? tiers[0].rate)}</dd></div>
        </dl>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Вознаграждение считается от суммы, которую клиент оплатил по договору, и выплачивается после каждой его оплаты пропорционально.</p>
      </aside>
        <aside className="rounded-xl border bg-background p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Или услуги ×{SERVICES_MULTIPLIER}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{fmtRub(total * SERVICES_MULTIPLIER)}</p>
          <p className="mt-1 text-sm text-muted-foreground">столько стоят услуги, которые я сделаю для вас вместо выплаты</p>
          <ul className="mt-5 space-y-4 border-t pt-4">
            {freeServices.map((f) => {
              const fill = Math.min(1, (total * SERVICES_MULTIPLIER) / f.price);
              return (
                <li key={f.title}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{f.title}</span>
                    <span className={cn("tabular-nums", fill >= 1 ? "font-medium text-brand" : "text-muted-foreground")}>{fill >= 1 ? "бесплатно" : `${Math.round(fill * 100)} %`}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fill * 100)} aria-label={`${f.title}: оплачено рекомендацией`}>
                    <div className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out motion-reduce:transition-none" style={{ width: `${fill * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">{fill >= 1 ? "Рекомендация полностью покрывает стоимость" : `Ещё ${fmtRub(f.price - total * SERVICES_MULTIPLIER)} из ${fmtRub(f.price)}`}</p>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
